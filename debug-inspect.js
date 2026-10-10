const fs = require('fs');
const path = 'src/views/AICommandCenter.jsx';
const text = fs.readFileSync(path, 'utf8');
for (let i = 0; i < text.length; i++) {
  const ch = text.charCodeAt(i);
  if (ch < 32 && ch !== 9 && ch !== 10 && ch !== 13) {
    console.log('NONPRINTABLE', i, ch, JSON.stringify(text.slice(i, i + 10)));
    break;
  }
}
console.log('length', text.length);
for (let i = 470; i <= 520; i++) {
  if (i <= text.split(/\r?\n/).length) {
    const line = text.split(/\r?\n/)[i - 1];
    if (line) console.log(i, JSON.stringify(line));
  }
}
