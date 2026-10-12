import io, re, sys

base = 'D:/2026-10-08-19-56-19/workbench/'
h = io.open(base + 'skeleton.html', encoding='utf-8').read()
j = io.open(base + 'app.js', encoding='utf-8').read()

# 剥掉 app.js 自带的 <script> 包裹（skeleton 已提供内联标签）
j = re.sub(r'^\s*<script[^>]*>\s*', '', j)
j = re.sub(r'\s*</script>\s*$', '', j)

assert '<script>' in h, 'skeleton 缺少内联 script 占位'
assert '__MODULE_SCRIPT__' in h
assert '<script' not in j and '</script>' not in j, 'app.js 仍含 script 标签'

out = h.replace('__MODULE_SCRIPT__', j)
io.open(base + '紫薯观影手账.html', 'w', encoding='utf-8').write(out)

# 结构自检
print('size            :', len(out))
print('script open     :', out.count('<script'))
print('script close    :', out.count('</script>'))
print('has talkNext1   :', 'talkNext1' in out)
print('has FALLBACK    :', 'FALLBACK' in out)
print('dd containers   :', out.count('class="dd"'))
print('st-tabs         :', out.count('st-tab"') + out.count('st-tab" data'))
print('T1/T2/T3 items  :', len(re.findall(r"'[^']*'", out.split('var T1=')[1].split('function nextTalk')[0])))
