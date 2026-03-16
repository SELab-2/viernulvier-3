class AppException(Exception):
    """Base exception for application errors"""
    pass


class NotFoundError(AppException):
    def __init__(self, resource: str, resource_id: int | None = None):
        self.resource = resource
        self.resource_id = resource_id

        if resource_id:
            message = f"{resource} with id {resource_id} not found"
        else:
            message = f"{resource} not found"

        super().__init__(message)
        
        

class ValidationError(AppException):
    pass