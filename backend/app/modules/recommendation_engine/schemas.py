"""
nena-man · backend/app/modules/recommendation_engine/schemas.py
Marshmallow schemas for M3 Adaptive Learning Recommendation Engine.

Validates input payloads from:
  1. Frontend session pipeline (camelCase RecommendationInput)
  2. Legacy recommendation service (snake_case telemetry payload)
"""

from marshmallow import Schema, fields, validate, EXCLUDE


class RecommendationRequestSchema(Schema):
    """
    Unified request schema accepting both camelCase (sessionPipeline)
    and snake_case (recommendationService) payloads.
    """
    class Meta:
        unknown = EXCLUDE

    # Child identifier
    child_id = fields.Str(load_default="anonymous", data_key="child_id")
    childId = fields.Str(load_default=None, data_key="childId")

    # Accuracy metrics
    readingAccuracy = fields.Float(load_default=None, data_key="readingAccuracy")
    reading_accuracy = fields.Float(load_default=None, data_key="reading_accuracy")
    previousAccuracy = fields.Float(load_default=None, data_key="previousAccuracy")
    previous_accuracy = fields.Float(load_default=None, data_key="previous_accuracy")

    # Error analysis metrics
    errorPatternSummary = fields.Dict(load_default=None, data_key="errorPatternSummary")
    speech_errors = fields.Dict(load_default=None, data_key="speech_errors")
    errorCount = fields.Int(load_default=None, data_key="errorCount")
    error_count = fields.Int(load_default=None, data_key="error_count")

    # Difficulty metrics
    difficultyLevel = fields.Raw(load_default=None, data_key="difficultyLevel")
    text_difficulty = fields.Raw(load_default=None, data_key="text_difficulty")
    difficulty_level = fields.Raw(load_default=None, data_key="difficulty_level")

    # Behavioral metrics
    behavioralState = fields.Str(load_default=None, data_key="behavioralState")
    behavior_state = fields.Str(load_default=None, data_key="behavior_state")
    behaviour_state = fields.Str(load_default=None, data_key="behaviour_state")

    # Latency metrics
    responseLatency = fields.Float(load_default=None, data_key="responseLatency")
    response_latency = fields.Float(load_default=None, data_key="response_latency")
    response_latency_ms = fields.Float(load_default=None, data_key="response_latency_ms")

    # History arrays
    activityHistory = fields.List(fields.Str(), load_default=None, data_key="activityHistory")
    activity_history = fields.List(fields.Str(), load_default=None, data_key="activity_history")
    difficultyHistory = fields.List(fields.Str(), load_default=None, data_key="difficultyHistory")
    difficulty_history = fields.List(fields.Str(), load_default=None, data_key="difficulty_history")

    # Target skill hint (optional)
    skillId = fields.Str(load_default=None, data_key="skillId")
    skill_id = fields.Str(load_default=None, data_key="skill_id")


class RecommendedActivityItemSchema(Schema):
    """Schema for each recommended activity in the ranked list."""
    activityId = fields.Str(required=True)
    activity_id = fields.Str(required=True)
    title = fields.Str(required=True)
    rank = fields.Int(required=True)
    skill_category = fields.Str(required=True)
    difficulty_level = fields.Int(required=True)
    model_activity_id = fields.Str(required=True)


class XAIFactorSchema(Schema):
    """Explainability factor detailing feature impact."""
    name = fields.Str(required=True)
    weight = fields.Int(required=True)
    direction = fields.Str(validate=validate.OneOf(["positive", "negative", "neutral"]))
    description = fields.Str(required=True)
    featureKey = fields.Str(load_default=None)
    shapValue = fields.Float(load_default=None)


class SHAPFeatureContributionSchema(Schema):
    """Local SHAP attribution for an individual feature."""
    feature = fields.Str(required=True)
    featureKey = fields.Str(required=True)
    rawValue = fields.Raw(required=True)
    shapValue = fields.Float(required=True)
    direction = fields.Str(validate=validate.OneOf(["positive", "negative", "neutral"]))
    description = fields.Str(required=True)


class SHAPExplanationSchema(Schema):
    """Complete structured SHAP explanation envelope."""
    method = fields.Str(required=True)
    isShap = fields.Bool(required=True)
    predictedClass = fields.Str(required=True)
    predictedClassIndex = fields.Int(load_default=None)
    baseProbability = fields.Float(load_default=None)
    predictedProbability = fields.Float(load_default=None)
    featureContributions = fields.List(fields.Nested(SHAPFeatureContributionSchema), load_default=[])
    rawTransformedContributions = fields.List(fields.Dict(), load_default=[])
    fallbackReason = fields.Str(load_default=None)


class RecommendationResponseSchema(Schema):
    """Response schema meeting both frontend consumer specifications."""
    recommendation = fields.Str(required=True)
    difficultyAction = fields.Str(required=True)
    nextActivityId = fields.Str(required=True)
    next_activity_id = fields.Str(required=True)
    nextActivityLabel = fields.Str(required=True)
    targetPhonemeSkill = fields.Str(required=True)
    target_skill = fields.Str(required=True)
    confidence = fields.Float(required=True)
    recommendedActivities = fields.List(fields.Nested(RecommendedActivityItemSchema), required=True)
    recommended_activities = fields.List(fields.Nested(RecommendedActivityItemSchema), required=True)
    rationale = fields.List(fields.Str(), required=True)
    xaiFactors = fields.List(fields.Nested(XAIFactorSchema), load_default=[])
    shapExplanation = fields.Nested(SHAPExplanationSchema, load_default=None)
