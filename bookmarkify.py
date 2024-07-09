import sys
import re
import urllib.parse

def transform_javascript_to_bookmarklet(input_file):
    with open(input_file, 'r') as f:
        content = f.read()

    content = re.sub(r'^\s*\/\/.*', '', content, flags=re.MULTILINE)
    content = content.replace('\n', '')
    content = content.replace('"', '\'')

    transformed_lines = []
    for line in content.split(';'):
        # Remove consecutive spaces
        line = ' '.join(line.split())
        transformed_lines.append(line.strip())
    
    urlencoded_js = urllib.parse.quote(';'.join(transformed_lines))

    return 'javascript: (() => {%s})();'%(urlencoded_js)

def inject_bookmarklet_into_html(bookmarklet_script, html_file):
    with open(html_file, 'r') as f:
        html = f.read()

    final_html = re.sub(r'<a href="[^"]*" onclick="return false;">GPSH</a>','<a href="{}" onclick="return false;">GPSH</a>'.format(bookmarklet_script), html)

    with open(html_file, 'w') as f:
        f.write(final_html)
    
if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python script.py input_file.js")
        sys.exit(1)

    input_file = sys.argv[1]
    bookmarklet = transform_javascript_to_bookmarklet(input_file)
    print("Transformation complete")

    html_file = "index.html"
    inject_bookmarklet_into_html(bookmarklet, html_file)
    print("Bookmarklet script injected into ", html_file)