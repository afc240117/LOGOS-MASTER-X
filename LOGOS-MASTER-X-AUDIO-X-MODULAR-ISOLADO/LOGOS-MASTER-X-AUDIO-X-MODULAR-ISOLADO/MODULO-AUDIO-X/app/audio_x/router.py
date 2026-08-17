from fastapi import APIRouter

from .routes.audio_x_cloud_router import router as cloud_router
from .routes.audio_x_cloud_upload import router as upload_router
from .routes.audio_x_cloud_transcription import router as transcription_router
from .routes.audio_x_cloud_async import router as async_router
from .routes.audio_x_cloud_segmentation import router as segmentation_router
from .routes.audio_x_dna_k7 import router as dna_router
from .routes.audio_x_dna_profiles import router as profiles_router
from .routes.audio_x_studio_bridge import router as studio_router
from .routes.audio_x_full_pipeline import router as pipeline_router
from .routes.audio_x_history import router as history_router
from .routes.audio_x_usage import router as usage_router
from .routes.audio_x_quality_gate import router as quality_router
from .routes.audio_x_homologation import router as homologation_router

router = APIRouter()
for _r in (
    cloud_router, upload_router, transcription_router, async_router,
    segmentation_router, dna_router, profiles_router, studio_router,
    pipeline_router, history_router, usage_router, quality_router,
    homologation_router,
):
    router.include_router(_r)
