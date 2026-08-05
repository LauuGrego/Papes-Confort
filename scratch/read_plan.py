import zipfile
import xml.etree.ElementTree as ET
import os

docx_path = r"c:\Users\Lautaro\Documents\Programming\Papes Confort\archivos_info\Plan de Desarrollo.docx"
output_path = r"c:\Users\Lautaro\Documents\Programming\Papes Confort\scratch\plan_de_desarrollo_text.txt"

def get_docx_text(path):
    try:
        doc = zipfile.ZipFile(path)
        xml_content = doc.read('word/document.xml')
        root = ET.fromstring(xml_content)
        
        # Word XML namespaces
        ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
        
        paragraphs = []
        for paragraph in root.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
            texts = [node.text for node in paragraph.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if node.text]
            if texts:
                paragraphs.append(''.join(texts))
        return '\n'.join(paragraphs)
    except Exception as e:
        return f"Error: {e}"

text = get_docx_text(docx_path)
os.makedirs(os.path.dirname(output_path), exist_ok=True)
with open(output_path, 'w', encoding='utf-8') as f:
    f.write(text)

print("Extraction completed!")
