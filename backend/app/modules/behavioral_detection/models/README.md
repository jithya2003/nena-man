# M4 Behavioral Detection — Model Checkpoints Directory

Place your Colab-trained model files and scalers in this directory:

```
backend/app/modules/behavioral_detection/models/
├── best_behaviour_gru.pt           # PyTorch Camera GRU model (30 frames x 1503 features)
├── scaler_mean.npy                 # Camera feature scaler mean array
├── scaler_scale.npy                # Camera feature scaler scale array
├── best_audio_frustration_model.pt # PyTorch Audio frustration classifier model
├── audio_scaler.pkl                # Audio feature scaler (pickle / joblib)
└── best_interaction_model.keras    # Keras/TensorFlow interaction telemetry classifier
```

### Expected Classes
All models predict or contribute to the 3 target states:
1. `Engaged`
2. `Distracted`
3. `Frustrated`

> Note: If any model file is absent, the backend service uses graceful fallback inference and logs a friendly notice. You can verify model readiness at `GET /api/v1/behavior/status`.
