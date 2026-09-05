import urllib.request
import json
import uuid

BASE = 'http://127.0.0.1:8000/api/v1'

VALID_JPEG = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xff\xdb\x00C\x00" + b"\x00" * 50

def run_network_upload_test():
    email = f"netupload_{uuid.uuid4().hex[:8]}@example.com"
    password = "StrongPassword123!"

    # 1. Register User
    reg_data = json.dumps({'email': email, 'full_name': 'Live Upload Tester', 'password': password}).encode()
    req = urllib.request.Request(f'{BASE}/auth/register', data=reg_data, headers={'Content-Type': 'application/json'}, method='POST')
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 201
        print(f'[1/4] Registered user: {email}')

    # 2. Login
    login_data = json.dumps({'email': email, 'password': password}).encode()
    req = urllib.request.Request(f'{BASE}/auth/login', data=login_data, headers={'Content-Type': 'application/json'}, method='POST')
    with urllib.request.urlopen(req) as resp:
        tokens = json.loads(resp.read().decode())
        token = tokens['access_token']
        print('[2/4] Login OK, acquired JWT.')

    # 3. Multipart Upload
    boundary = f"----WebKitFormBoundary{uuid.uuid4().hex}"
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="camera_photo.jpg"\r\n'
        f"Content-Type: image/jpeg\r\n\r\n"
    ).encode() + VALID_JPEG + f"\r\n--{boundary}--\r\n".encode()

    upload_req = urllib.request.Request(
        f'{BASE}/upload/image',
        data=body,
        headers={
            'Content-Type': f'multipart/form-data; boundary={boundary}',
            'Authorization': f'Bearer {token}'
        },
        method='POST'
    )
    with urllib.request.urlopen(upload_req) as resp:
        upload_data = json.loads(resp.read().decode())
        image_url = upload_data['image_url']
        print(f'[3/4] Live upload successful! Returned image_url: {image_url}')

    # 4. Create Lost Item with returned image_url
    item_payload = json.dumps({
        'title': 'Canon EOS R6 Camera in Black Bag',
        'category': 'electronics',
        'description': 'Found in a padded black shoulder bag.',
        'location': 'Media Arts Lab Floor 2',
        'date_lost': '2026-09-05T14:00:00Z',
        'reward': '$100 Reward',
        'image_url': image_url,
        'contact_name': 'Live Upload Tester'
    }).encode()
    create_req = urllib.request.Request(
        f'{BASE}/lost-items',
        data=item_payload,
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {token}'
        },
        method='POST'
    )
    with urllib.request.urlopen(create_req) as resp:
        created_item = json.loads(resp.read().decode())
        assert created_item['image_url'] == image_url
        print(f'[4/4] Lost item #{created_item["id"]} created with confirmed image_url: {created_item["image_url"]}')

    print('\n=============================================================')
    print('ALL LIVE NETWORK UPLOAD & PERSISTENCE TESTS PASSED!')
    print('=============================================================')

if __name__ == '__main__':
    run_network_upload_test()
