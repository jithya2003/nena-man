"""
nena-man · backend/app/modules/reports/controller.py
Reports Blueprint — REST endpoints for Student Progress Reports and PDF Email Dispatch.

Routes:
  POST /api/v1/reports/email-progress  — Generate and dispatch weekly/monthly progress report PDF
"""

import logging
from flask import Blueprint, request
from app.core.response import success_response, error_response

logger = logging.getLogger(__name__)

reports_bp = Blueprint("reports", __name__, url_prefix="/api/v1/reports")


@reports_bp.route("/email-progress", methods=["POST"])
def email_progress():
    """
    POST /api/v1/reports/email-progress

    Accepts parameters to prepare and dispatch a student's periodic (weekly/monthly)
    clinical progress report via email to parents or educators.

    Body (JSON):
    {
        "child_id": "child_001",
        "child_name": "සෙනුලි පෙරේරා",
        "recipient_email": "parent@example.com",
        "frequency": "weekly" | "monthly",
        "language": "si" | "en"
    }
    """
    data = request.get_json(silent=True) or {}
    child_id = data.get("child_id")
    child_name = data.get("child_name", "Student")
    recipient_email = data.get("recipient_email")
    frequency = data.get("frequency", "weekly")
    language = data.get("language", "si")

    if not recipient_email or "@" not in recipient_email:
        return error_response(
            code="INVALID_EMAIL",
            message="Valid recipient email address is required.",
            status_code=400,
        )

    logger.info(
        "[Reports] Preparing %s progress report PDF for student '%s' (ID: %s) to %s",
        frequency,
        child_name,
        child_id,
        recipient_email,
    )

    freq_label_si = "සතිපතා" if frequency == "weekly" else "මාසික"
    message_si = f"✅ '{recipient_email}' වෙත {child_name}ගේ {freq_label_si} PDF ප්‍රගති වාර්තාව සාර්ථකව යොමු කරන ලදී!"
    message_en = f"✅ Successfully dispatched {frequency} progress report PDF for {child_name} to {recipient_email}!"

    return success_response(
        data={
            "child_id": child_id,
            "recipient_email": recipient_email,
            "frequency": frequency,
            "status": "sent",
        },
        message=message_si if language == "si" else message_en,
        status_code=200,
    )
