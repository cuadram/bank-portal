#!/usr/bin/env python3
"""
fix-docx.py — FA-Agent SOFIA v1.9.1
Parchea un docx generado por docx-js añadiendo los archivos XML que faltan
y que son referenciados en las relaciones pero no incluidos en el ZIP.

Uso:
  python3 .sofia/scripts/fix-docx.py docs/functional-analysis/FA-BankPortal-Banco-Meridian.docx
"""

import sys
import os
import zipfile
import shutil
import tempfile
import re
import xml.etree.ElementTree as ET

SETTINGS_XML = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:defaultTabStop w:val="720"/>
</w:settings>'''

COMMENTS_XML = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:comments xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
</w:comments>'''

FONT_TABLE_XML = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:fonts xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:font w:name="Arial">
    <w:panose1 w:val="020B0604020202020204"/>
    <w:charset w:val="00"/>
    <w:family w:val="swiss"/>
    <w:pitch w:val="variable"/>
  </w:font>
  <w:font w:name="Arial Black">
    <w:panose1 w:val="020B0A04020102020204"/>
    <w:charset w:val="00"/>
    <w:family w:val="swiss"/>
    <w:pitch w:val="variable"/>
  </w:font>
</w:fonts>'''

ENDNOTES_XML = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:endnotes xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
</w:endnotes>'''

FOOTNOTES_XML = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:footnotes xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
</w:footnotes>'''

MISSING_FILES = {
    'word/settings.xml': SETTINGS_XML,
    'word/comments.xml': COMMENTS_XML,
    'word/fontTable.xml': FONT_TABLE_XML,
    'word/endnotes.xml': ENDNOTES_XML,
    'word/footnotes.xml': FOOTNOTES_XML,
}

def fix_docx(path):
    print(f'Fixing: {path}')
    tmp = path + '.tmp'
    
    with zipfile.ZipFile(path, 'r') as zin:
        existing = set(zin.namelist())
        with zipfile.ZipFile(tmp, 'w', zipfile.ZIP_DEFLATED) as zout:
            # Copy all existing files
            for name in existing:
                data = zin.read(name)
                # Fix empty XML files
                if (name.endswith('.xml') or name.endswith('.rels')) and len(data) == 0:
                    if name in MISSING_FILES:
                        data = MISSING_FILES[name].encode('utf-8')
                zout.writestr(name, data)
            
            # Add missing files
            added = []
            for fname, content in MISSING_FILES.items():
                if fname not in existing:
                    zout.writestr(fname, content.encode('utf-8'))
                    added.append(fname)
    
    # Validate
    errors = []
    with zipfile.ZipFile(tmp, 'r') as z:
        for name in z.namelist():
            if name.endswith('.xml') or name.endswith('.rels'):
                try:
                    ET.fromstring(z.read(name))
                except Exception as e:
                    errors.append(f'{name}: {e}')
    
    if errors:
        os.remove(tmp)
        print(f'ERROR: XML validation failed: {errors}')
        return False
    
    # Replace original
    shutil.move(tmp, path)
    print(f'Fixed: {path}')
    if added:
        print(f'Added missing files: {added}')
    print('All XML valid. Word should open this file correctly.')
    return True

if __name__ == '__main__':
    if len(sys.argv) < 2:
        # Default path
        path = '/Users/cuadram/proyectos/bank-portal/docs/functional-analysis/FA-BankPortal-Banco-Meridian.docx'
    else:
        path = sys.argv[1]
    
    if not os.path.exists(path):
        print(f'File not found: {path}')
        sys.exit(1)
    
    success = fix_docx(path)
    sys.exit(0 if success else 1)
