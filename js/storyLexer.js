var Macro = require('./models/Macro')

function analyze(string) {
  var data = {};
  var macro
  var parentMacro
  var link;
  var macroStack = [];

  data.macros = [];
  data.links = [];
  data.content = string;
  
  for (var index = 0; index < data.content.length; index++) {
    parentMacro = macroStack[macroStack.length - 1];
    if (!parentMacro) { parentMacro = data; }

    /* MACROS */
    if (data.content[index] === '<' && data.content[index + 1] === '<') {
      macro && macro.setContent(data.content.slice(macro.endIndex + 1, index));

      macro = lexMacro(data.content, index);

      if(macro.type === 'if') { 
        macro.innerStartIndex = macro.endIndex;
        macroStack.push(macro);
      }

      if(macro.type === 'else') {
        parentMacro.else.push(macro);
      }

      if(macro.type === 'endif') {
        macroStack.pop();

        parentMacro.contentStart = parentMacro.endIndex;
        parentMacro.endIndex = macro.endIndex;
        parentMacro.convertContent();
      }
      
      if (macro.type !== 'endif' && macro.type !== 'else') {
        parentMacro.macros.push(macro);
      }
    }

    /* LINKS */
    if(data.content[index] === '[' && data.content[index + 1] === '[') {
      link = lexLink(data.content, index);
      parentMacro.links.push(link);
    }
  }

  data.contentStart = -1;
  Macro.convertContent.call(data);

  return data;
}

function lexLink (story, index) {
  var link = {};
  var tokens;
  var endIndex;

  endIndex = story.indexOf(']]', index);
  link.startIndex = index;
  tokens = story.substring(index + 2, endIndex);
  tokens = tokens.split('|');

  link.text = tokens[0];
  link.target = tokens[1] || tokens[0];
  link.endIndex = endIndex + 1;

  return link;
}

function lexMacro(story, index) {
  var macro = Object.create(Macro);
  var tokens;
  var endIndex;

  macro.init();
  endIndex = story.indexOf('>>', index);
  tokens = story.substring(index + 2, endIndex);
  tokens = tokens.split(' ');
  macro.type = tokens.shift();

  if(macro.type === 'else' && tokens[0] === 'if') {
    tokens.shift();
  }

  if(macro.type === 'elseif') {
    macro.type = 'else';
  }

  macro.expression = tokens.join(' ');
  macro.startIndex = index;
  macro.endIndex = endIndex + 1;

  return macro;
}

module.exports = {
  analyze: analyze,
  lexMacro: lexMacro,
  lexLink: lexLink
}