interface OpToken {
    tokentype: "op",
    value: string
};

interface NumToken {
    tokentype: "num",
    value: string
};

type Token = OpToken | NumToken;

function tokenizer(calcstring: string): Token[] {
    let tokens: Token[] = [];
    calcstring = calcstring.replace(/\s/g, "");
    //console.log(calcstring);
    while(calcstring.length > 0) {
        let numpart = /^(\d+)(.*)/.exec(calcstring);
        let oppart = /^([*/+()-])(.*)/.exec(calcstring);
        if(numpart) {
            tokens.push({tokentype:"num", value: numpart[1]});
            calcstring = numpart[2];
        } else if(oppart) {
            tokens.push({tokentype:"op", value: oppart[1]});
            calcstring = oppart[2];
        }else{
            throw new SyntaxError("Non-math"+calcstring);
        }
    }
    return tokens
}

//console.log(tokenizer('190 + 900 / 30 - 9 * 6'));

interface TreeValue {
    nodetype: "treevalue",
    value: number
};

interface Tree {
    nodetype: "tree",
    op: string,
    left: Tree | TreeValue,
    right: Tree | TreeValue
};

type TreeNode = TreeValue | Tree;
function parseExpr(tokens: Token[]): TreeNode {
    let left: TreeNode = parseAddend(tokens);
    do {
        if(tokens[0] && tokens[0].tokentype === 'op' && (tokens[0].value === '+' || tokens[0].value === '-')) {
            let op: Token = <Token>tokens.shift();
            let right: TreeNode = parseExpr(tokens);
            left = {nodetype: "tree", op: op.value, left, right};
        }
    } while(tokens[0] && tokens[0].tokentype === 'op' && (tokens[0].value === '+' || tokens[0].value === '-'))
    return left;
}

function parseAddend(tokens: Token[]): TreeNode {
    let left = parseFactor(tokens);
    do {
        if(tokens[0] && tokens[0].tokentype === 'op' && (tokens[0].value === '*' || tokens[0].value === '/')) {
            let op: Token = <Token>tokens.shift();
            let right: TreeNode = parseAddend(tokens);
            left = {nodetype: "tree", op: op.value, left, right};
        }
    } while(tokens[0] && tokens[0].tokentype === 'op' && (tokens[0].value === '*' || tokens[0].value === '/'))
    return left;
}

function parseFactor(tokens: Token[]): TreeNode {
    let result: TreeNode;
    if(tokens[0] && tokens[0].tokentype === 'num') {
        result = {nodetype: "treevalue", value: parseInt(tokens[0].value)};
        tokens.shift()
    }else if(tokens[0] && tokens[0].tokentype === 'op' && tokens[0].value === '(') {
        tokens.shift();
        result = parseExpr(tokens);
        if(tokens[0] && tokens[0].tokentype === 'op' && tokens[0].value === ')') {
            tokens.shift()
        }else{
            throw new SyntaxError("Unmatched ("+ tokens);
        }
    }else{
        throw new SyntaxError("unknown symbol" + tokens); 
    }
    return result;
}

console.log(parseExpr(tokenizer('190 + 900 / 30 - 9 * 6')));
var result2 = parseExpr(tokenizer('190 + 900 / 30 - 9 * 6'));
function evaluateTree(tree: Tree | TreeValue): number {
    if(tree.nodetype === "tree") {
        switch(tree.op) {
            case '+': return evaluateTree(tree.left) + evaluateTree(tree.right);
            case '-': return evaluateTree(tree.left) - evaluateTree(tree.right);
            case '*': return evaluateTree(tree.left) * evaluateTree(tree.right);
            case '/': return evaluateTree(tree.left) / evaluateTree(tree.right);
            default: throw new SyntaxError("bad operation" + tree.op);
        }
    }else{
        return tree.value;
    }
}
console.log(evaluateTree(result2));
/*
 * calc ::= expr
 * expr ::= addend (('+' | '-') expr)*
 * addend ::= factor (('\*') | '/' addend)*
 * factor ::= number | '(' expr ')'
 * */

/*
 * calc ::= expr
 * expr ::= addend (('+' | '-') expr)*
 * addend ::= exponend (('\*') | '/' addend)*
 * exponend ::=  factor ('^' exponend)*
 * factor ::= number | '(' expr ')'
 * regular
 * context-free
 * context-sensitive
 * recursively enumerable
 * */
