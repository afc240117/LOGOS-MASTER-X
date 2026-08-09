@echo off
del /q "app\ai\providers\github_models.py" 2>nul
del /q "app\ai\providers\mistral.py" 2>nul
echo GitHub Models e Mistral removidos, se existiam.
pause
