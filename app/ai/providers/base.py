from dataclasses import dataclass
@dataclass
class ProviderResult:
    provider:str
    model:str
    text:str
class ProviderError(RuntimeError): pass
