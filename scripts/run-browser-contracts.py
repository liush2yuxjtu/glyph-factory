"""Run nonempty, unskipped browser suites and emit machine-readable evidence."""
import argparse
import json
import os
from pathlib import Path
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('suite',choices=['player','aha'])
args=parser.parse_args()
name=os.environ.get('GLYPH_BROWSER','chromium')
if name not in ('chromium','webkit'): parser.error('Unsupported GLYPH_BROWSER')
path='tests/browser' if args.suite=='player' else 'tests/intent-browser'
minimum=19 if args.suite=='player' else 37
suite=unittest.defaultTestLoader.discover(str(ROOT/path),pattern='test_*.py')
discovered=suite.countTestCases()
result=unittest.TextTestRunner(verbosity=2).run(suite)
passed=(discovered>=minimum and result.testsRun==discovered and result.wasSuccessful()
        and not result.skipped and not result.expectedFailures and not result.unexpectedSuccesses)
report={'suite':args.suite,'browser':name,'discovered':discovered,'run':result.testsRun,
        'failures':len(result.failures),'errors':len(result.errors),'skipped':len(result.skipped),
        'expectedFailures':len(result.expectedFailures),'unexpectedSuccesses':len(result.unexpectedSuccesses),
        'status':'PASS' if passed else 'FAIL'}
output=ROOT/'test-results/intent-audit'
output.mkdir(parents=True,exist_ok=True)
(output/f'{args.suite}-{name}.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report),flush=True)
sys.exit(0 if passed else 1)
