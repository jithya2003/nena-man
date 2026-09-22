"""
nena-man · backend/app/core/errors.py
Custom application exceptions and Flask error handler registrations.
All error responses use the standardised JSON envelope from response.py.
"""

from flask import Flask
from .response import error_response


# ---------------------------------------------------------------------------
# Custom Exception Classes
# ---------------------------------------------------------------------------

class NenaManBaseError(Exception):
    """Base class for all application-level errors."""
    status_code: int = 500
    default_message: str = "An unexpected error occurred."

    def __init__(self, message: str = None):
        self.message = message or self.default_message
        super().__init__(self.message)


class ValidationError(NenaManBaseError):
    """Raised when request data fails schema validation."""
    status_code = 422
    default_message = "Request validation failed."


class AuthenticationError(NenaManBaseError):
    """Raised when a Firebase ID token is missing, expired, or invalid."""
    status_code = 401
    default_message = "Authentication required. Provide a valid Firebase ID token."


class AuthorizationError(NenaManBaseError):
    """Raised when an authenticated user lacks permission for a resource."""
    status_code = 403
    default_message = "You do not have permission to perform this action."


class NotFoundError(NenaManBaseError):
    """Raised when a requested resource does not exist in Firestore or on disk."""
    status_code = 404
    default_message = "The requested resource was not found."


class ModelNotReadyError(NenaManBaseError):
    """
    Raised when an ML model checkpoint is required but has not been
    placed in the module's models/ directory yet.
    The system will NOT raise this in normal operation because each
    module's model_slot.py falls back to heuristic mode automatically.
    This is reserved for future strict-mode deployments.
    """
    status_code = 503
    default_message = "ML model checkpoint is not yet available. Running in heuristic mode."


# ---------------------------------------------------------------------------
# Flask Error Handler Registration
# ---------------------------------------------------------------------------

def register_error_handlers(app: Flask) -> None:
    """
    Register global error handlers on the Flask application.
    Call this inside create_app() after the app is created.
    """

    @app.errorhandler(NenaManBaseError)
    def handle_app_error(exc: NenaManBaseError):
        return error_response(message=exc.message, status_code=exc.status_code)

    @app.errorhandler(400)
    def bad_request(exc):
        return error_response("Bad request — malformed JSON or missing required field.", 400)

    @app.errorhandler(401)
    def unauthorized(exc):
        return error_response("Unauthorized — Firebase ID token required.", 401)

    @app.errorhandler(403)
    def forbidden(exc):
        return error_response("Forbidden — insufficient permissions.", 403)

    @app.errorhandler(404)
    def not_found(exc):
        return error_response("Endpoint not found.", 404)

    @app.errorhandler(405)
    def method_not_allowed(exc):
        return error_response("HTTP method not allowed for this endpoint.", 405)

    @app.errorhandler(500)
    def internal_error(exc):
        app.logger.exception("Unhandled server error: %s", exc)
        return error_response("Internal server error. Please contact the development team.", 500)
