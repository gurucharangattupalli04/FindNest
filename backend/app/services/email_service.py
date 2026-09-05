"""
Modular Email Service for FindNest.
Supports Console (Dev), Resend API, and SMTP delivery.
Generates responsive branded HTML emails and plain text fallbacks.
Safe and resilient: Catches all exceptions and returns boolean status.
"""
import json
import logging
import smtplib
import urllib.request
import urllib.error
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import List, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Service handling transactional email delivery for smart match notifications."""

    def __init__(self):
        self.enabled = settings.EMAIL_ENABLED
        self.provider = (settings.EMAIL_PROVIDER or "console").lower()
        self.from_email = settings.EMAIL_FROM

    @property
    def frontend_url(self) -> str:
        import os
        url = (settings.FRONTEND_URL or "").strip().rstrip("/")
        # If running on Render or if localhost was passed in cloud environment, use live Vercel URL
        if not url or "localhost" in url or "127.0.0.1" in url:
            if "RENDER" in os.environ:
                return "https://find-nest-jade.vercel.app"
        return url or "https://find-nest-jade.vercel.app"

    def send_smart_match_email(
        self,
        to_email: str,
        to_name: Optional[str],
        user_item_title: str,
        user_item_type: str,  # "lost" or "found"
        matched_item_id: int,
        matched_item_title: str,
        matched_item_category: str,
        matched_item_location: str,
        matched_item_date: Optional[str] = None,
        matched_item_image: Optional[str] = None,
        match_score: float = 0.0,
        match_reasons: Optional[List[str]] = None,
    ) -> bool:
        """
        Send a smart match notification email to the user.
        Returns True if sent/logged successfully, False otherwise.
        Never raises exceptions to callers.
        """
        try:
            greeting = f"Hi {to_name}" if to_name else "Hello"
            score_pct = int(round(match_score))
            
            if user_item_type.lower() == "lost":
                subject = f"🎯 FindNest Match Found ({score_pct}% Match): Potential match for your '{user_item_title}'"
                header_subtitle = f"A newly reported found item closely matches your lost report"
                action_text = f"Someone found an item that might be your '{user_item_title}'!"
            else:
                subject = f"🎯 FindNest Match Found ({score_pct}% Match): Your found '{user_item_title}' matches a lost report"
                header_subtitle = f"Your found item report closely matches someone's lost item"
                action_text = f"Your found item '{user_item_title}' might belong to a searching owner!"

            view_url = f"{self.frontend_url}/?match_item={matched_item_id}"
            
            # 1. Generate Plain Text Fallback
            plain_text = self._build_plain_text(
                greeting=greeting,
                action_text=action_text,
                user_item_title=user_item_title,
                matched_item_title=matched_item_title,
                matched_item_category=matched_item_category,
                matched_item_location=matched_item_location,
                matched_item_date=matched_item_date,
                score_pct=score_pct,
                match_reasons=match_reasons or [],
                view_url=view_url,
            )

            # 2. Generate Branded HTML Template
            html_content = self._build_html_template(
                greeting=greeting,
                header_subtitle=header_subtitle,
                action_text=action_text,
                user_item_title=user_item_title,
                user_item_type=user_item_type,
                matched_item_id=matched_item_id,
                matched_item_title=matched_item_title,
                matched_item_category=matched_item_category,
                matched_item_location=matched_item_location,
                matched_item_date=matched_item_date,
                matched_item_image=matched_item_image,
                score_pct=score_pct,
                match_reasons=match_reasons or [],
                view_url=view_url,
            )

            # If emails are disabled globally, log in console mode
            if not self.enabled:
                logger.info(
                    "[EmailService] EMAIL_ENABLED is False. Logging email for %s (Subject: %s)",
                    to_email,
                    subject,
                )
                self._log_console_email(to_email, subject, plain_text)
                return True

            # Dispatch according to configured provider
            if self.provider == "resend":
                return self._send_via_resend(to_email, subject, html_content, plain_text)
            elif self.provider == "smtp":
                return self._send_via_smtp(to_email, subject, html_content, plain_text)
            elif self.provider == "console":
                return self._send_via_console(to_email, subject, plain_text)
            else:
                logger.error(
                    "[EmailService] Unsupported email provider '%s'. Dispatch failed.",
                    self.provider,
                )
                return False

        except Exception as exc:
            logger.error(
                "[EmailService] Failed to dispatch match email to %s: %s",
                to_email,
                str(exc),
                exc_info=True,
            )
            return False

    def _send_via_console(self, to_email: str, subject: str, plain_text: str) -> bool:
        """Console provider: Logs formatted email to stdout / logger."""
        self._log_console_email(to_email, subject, plain_text)
        return True

    def _log_console_email(self, to_email: str, subject: str, plain_text: str) -> None:
        border = "=" * 60
        logger.info(
            "\n%s\n[CONSOLE EMAIL DISPATCH]\nTo: %s\nFrom: %s\nSubject: %s\n%s\n%s\n%s",
            border,
            to_email,
            self.from_email,
            subject,
            border,
            plain_text,
            border,
        )

    def _send_via_resend(
        self, to_email: str, subject: str, html_content: str, plain_text: str
    ) -> bool:
        """Resend API provider using standard library urllib."""
        api_key = settings.RESEND_API_KEY
        if not api_key:
            logger.warning("[EmailService] RESEND_API_KEY not configured. Falling back to console.")
            return self._send_via_console(to_email, subject, plain_text)

        payload = {
            "from": self.from_email,
            "to": [to_email],
            "subject": subject,
            "html": html_content,
            "text": plain_text,
        }
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            "https://api.resend.com/emails",
            data=data,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "User-Agent": "FindNest-EmailService/1.0",
            },
            method="POST",
        )

        try:
            with urllib.request.urlopen(req, timeout=10) as response:
                resp_data = response.read().decode("utf-8")
                logger.info("[EmailService] Email sent via Resend to %s. Response: %s", to_email, resp_data)
                return True
        except urllib.error.HTTPError as err:
            err_body = err.read().decode("utf-8", errors="ignore")
            logger.error("[EmailService] Resend API error (%s): %s", err.code, err_body)
            # Resend free tier allows sending only to the registered account owner's email address
            if err.code == 403 and "You can only send testing emails to your own email address" in err_body:
                import re
                match = re.search(r"\(([^)]+@[^)]+)\)", err_body)
                verified_addr = match.group(1) if match else None
                if verified_addr and verified_addr.lower() != to_email.lower():
                    logger.info(
                        "[EmailService] Resend Free Tier: Forwarding test alert to registered account email %s (intended for %s)",
                        verified_addr,
                        to_email,
                    )
                    payload["to"] = [verified_addr]
                    payload["subject"] = f"[FindNest Test for {to_email}] {subject}"
                    retry_data = json.dumps(payload).encode("utf-8")
                    retry_req = urllib.request.Request(
                        "https://api.resend.com/emails",
                        data=retry_data,
                        headers={
                            "Authorization": f"Bearer {api_key}",
                            "Content-Type": "application/json",
                            "User-Agent": "FindNest-EmailService/1.0",
                        },
                        method="POST",
                    )
                    try:
                        with urllib.request.urlopen(retry_req, timeout=10) as retry_resp:
                            retry_resp_data = retry_resp.read().decode("utf-8")
                            logger.info(
                                "[EmailService] Successfully forwarded test email to %s via Resend: %s",
                                verified_addr,
                                retry_resp_data,
                            )
                            return True
                    except Exception as retry_err:
                        logger.error("[EmailService] Resend retry failed: %s", retry_err)
            return False

    def _send_via_smtp(
        self, to_email: str, subject: str, html_content: str, plain_text: str
    ) -> bool:
        """SMTP provider using Python standard library smtplib with TLS."""
        host = settings.SMTP_HOST
        port = settings.SMTP_PORT
        user = settings.SMTP_USER
        password = settings.SMTP_PASSWORD
        use_tls = settings.SMTP_TLS

        if not host:
            logger.warning("[EmailService] SMTP_HOST not configured. Falling back to console.")
            return self._send_via_console(to_email, subject, plain_text)

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = self.from_email
        msg["To"] = to_email

        part1 = MIMEText(plain_text, "plain", "utf-8")
        part2 = MIMEText(html_content, "html", "utf-8")
        msg.attach(part1)
        msg.attach(part2)

        server = smtplib.SMTP(host, port, timeout=15)
        try:
            if use_tls:
                server.starttls()
            if user and password:
                server.login(user, password)
            server.sendmail(self.from_email, [to_email], msg.as_string())
            logger.info("[EmailService] Email successfully sent via SMTP to %s", to_email)
            return True
        finally:
            try:
                server.quit()
            except Exception:
                pass

    def _build_plain_text(
        self,
        greeting: str,
        action_text: str,
        user_item_title: str,
        matched_item_title: str,
        matched_item_category: str,
        matched_item_location: str,
        matched_item_date: Optional[str],
        score_pct: int,
        match_reasons: List[str],
        view_url: str,
    ) -> str:
        reasons_str = "\n".join([f"- {r}" for r in match_reasons]) if match_reasons else "- High semantic and category similarity"
        date_str = f"Date: {matched_item_date}\n" if matched_item_date else ""
        return f"""{greeting},

{action_text}

=== SMART MATCH DETAILS ===
Match Confidence: {score_pct}%
Your Report: {user_item_title}
Matched Report: {matched_item_title}
Category: {matched_item_category.title()}
Location: {matched_item_location}
{date_str}
Key Match Factors:
{reasons_str}

To review this match and contact the finder/owner safely, open FindNest:
{view_url}

Safety Tip: Never exchange money in advance and always meet in a public, well-lit place.

Best regards,
The FindNest Team
"""

    def _build_html_template(
        self,
        greeting: str,
        header_subtitle: str,
        action_text: str,
        user_item_title: str,
        user_item_type: str,
        matched_item_id: int,
        matched_item_title: str,
        matched_item_category: str,
        matched_item_location: str,
        matched_item_date: Optional[str],
        matched_item_image: Optional[str],
        score_pct: int,
        match_reasons: List[str],
        view_url: str,
    ) -> str:
        reasons_html = "".join(
            [f'<li style="margin-bottom: 6px; color: #334155;">{r}</li>' for r in match_reasons]
        ) if match_reasons else '<li style="color: #334155;">High semantic and category similarity</li>'

        image_html = ""
        if matched_item_image:
            image_html = f"""
            <div style="text-align: center; margin: 16px 0;">
                <img src="{matched_item_image}" alt="{matched_item_title}" style="max-width: 100%; max-height: 220px; border-radius: 10px; object-fit: cover; border: 1px solid #e2e8f0;" />
            </div>
            """

        date_html = ""
        if matched_item_date:
            date_html = f'<p style="margin: 4px 0; color: #475569; font-size: 14px;"><strong>Date:</strong> {matched_item_date}</p>'

        return f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Smart AI Match Detected</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
        <!-- Header -->
        <tr>
            <td style="padding: 28px 32px; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <span style="font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">🔍 FindNest</span>
                    <span style="background-color: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">AI Match Alert</span>
                </div>
                <h1 style="margin: 16px 0 6px 0; font-size: 24px; font-weight: 700; color: #ffffff;">Smart AI Match Detected!</h1>
                <p style="margin: 0; font-size: 14px; color: #e0e7ff;">{header_subtitle}</p>
            </td>
        </tr>

        <!-- Body -->
        <tr>
            <td style="padding: 32px;">
                <p style="font-size: 16px; margin: 0 0 16px 0;"><strong>{greeting}</strong>,</p>
                <p style="font-size: 15px; line-height: 1.6; margin: 0 0 24px 0; color: #334155;">{action_text}</p>

                <!-- Confidence Badge -->
                <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center;">
                    <span style="font-size: 28px; font-weight: 800; color: #15803d;">🎯 {score_pct}%</span>
                    <span style="font-size: 14px; font-weight: 600; color: #166534; display: block; margin-top: 4px;">High Confidence Match</span>
                </div>

                {image_html}

                <!-- Item Comparison Card -->
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                    <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Matched Item Details</h3>
                    <p style="margin: 4px 0; color: #475569; font-size: 14px;"><strong>Title:</strong> {matched_item_title}</p>
                    <p style="margin: 4px 0; color: #475569; font-size: 14px;"><strong>Category:</strong> {matched_item_category.title()}</p>
                    <p style="margin: 4px 0; color: #475569; font-size: 14px;"><strong>Location:</strong> {matched_item_location}</p>
                    {date_html}
                </div>

                <!-- Match Reasons -->
                <div style="margin-bottom: 28px;">
                    <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Why this is a match:</h4>
                    <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.5;">
                        {reasons_html}
                    </ul>
                </div>

                <!-- CTA Button -->
                <div style="text-align: center; margin: 32px 0;">
                    <a href="{view_url}" style="background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 15px; font-weight: 600; display: inline-block; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);">
                        View Smart AI Match →
                    </a>
                </div>

                <!-- Safety Note -->
                <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px; margin-top: 24px;">
                    <p style="margin: 0; font-size: 13px; color: #92400e; line-height: 1.5;">
                        <strong>Safety Note:</strong> Always meet in a secure, public place (such as a local police station or campus safety desk) when claiming items. Never send money in advance.
                    </p>
                </div>
            </td>
        </tr>

        <!-- Footer -->
        <tr>
            <td style="padding: 24px 32px; background-color: #f1f5f9; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
                <p style="margin: 0 0 4px 0;">You received this notification because your FindNest item report generated an automated AI match.</p>
                <p style="margin: 0;">© 2026 FindNest. All rights reserved.</p>
            </td>
        </tr>
    </table>
</body>
</html>
"""


email_service = EmailService()
