import os
import uvicorn

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0" if os.environ.get("PORT") else "127.0.0.1")
    reload = not bool(os.environ.get("PORT"))
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=reload
    )
