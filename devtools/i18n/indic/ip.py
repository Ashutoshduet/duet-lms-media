# load IndicProcessor without the package __init__ (which needs a newer transformers)
import importlib.util, sys, types
pkg = types.ModuleType('IndicTransToolkit'); pkg.__path__ = ['/usr/local/lib/python3.13/dist-packages/IndicTransToolkit']; sys.modules['IndicTransToolkit'] = pkg
spec = importlib.util.spec_from_file_location('IndicTransToolkit.processor', '/usr/local/lib/python3.13/dist-packages/IndicTransToolkit/processor.cpython-313-x86_64-linux-gnu.so')
mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
IndicProcessor = mod.IndicProcessor
