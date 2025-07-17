import os
from datetime import timedelta
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

    def get_file(self, minio_path, tmp_dir=None):
        if tmp_dir is None:
            tmp_dir = tempfile.gettempdir()
            
        local_path = os.path.join(tmp_dir, os.path.basename(minio_path))

        self.client.fget_object(self.bucket, minio_path, local_path)
        return local_path


    def upload_file(self, local_path, minio_path):
        self.client.fput_object(self.bucket, minio_path, local_path)
        return minio_path
    
    def get_presigned_url(self, minio_path, expiry=3600):
        try:
            presigned_url = self.client.presigned_get_object(
                self.bucket,
                minio_path,
                expires=timedelta(seconds=expiry)
            )
            return presigned_url

        except Exception as e:
            raise RuntimeError(f"Lỗi tạo presigned URL: {e}")

    def list_file(self, prefix, recursive=True):
        try:
            objects = self.client.list_objects(self.bucket, prefix=prefix, recursive=recursive)
            return [obj.object_name for obj in objects]
        except Exception as e:
            raise RuntimeError(f"Lỗi liệt kê file: {e}")