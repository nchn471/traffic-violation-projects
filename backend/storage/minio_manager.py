import os
from datetime import datetime
from minio import Minio
from dotenv import load_dotenv
import tempfile

load_dotenv()

MINIO_CONFIG = {
    "endpoint_url": os.getenv('MINIO_ENDPOINT'),
    "aws_access_key_id": os.getenv('AWS_ACCESS_KEY_ID'),
    "aws_secret_access_key": os.getenv('AWS_SECRET_ACCESS_KEY'),
    "bucket": os.getenv("MINIO_BUCKET"),
}

class MinIOManager:
    def __init__(self, config=MINIO_CONFIG):
        self._config = config

        self.client = Minio(
            endpoint=self._config.get("endpoint_url"),
            access_key=self._config.get("aws_access_key_id"),
            secret_key=self._config.get("aws_secret_access_key"),
            secure=False,
        )
        self.bucket = self._config.get("bucket")
        if not self.client.bucket_exists(self.bucket):
            self.client.make_bucket(self.bucket)

    def get_file(self, minio_path):
        
        temp_dir = tempfile.gettempdir()
        local_path = os.path.join(temp_dir, os.path.basename(minio_path))

        if not os.path.exists(local_path):
            self.client.fget_object(self.bucket, minio_path, local_path)

        return local_path

    def upload_file(self, local_path, minio_path):
        self.client.fput_object(self.bucket, minio_path, local_path)
        return minio_path
    
    def get_presigned_url(self, minio_path, expiry=3600):
        return self.client.presigned_get_object(self.bucket, minio_path, expires=expiry)


