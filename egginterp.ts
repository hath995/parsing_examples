
function skipSpace(str: string) {
    var first = str.search(/\S/);
    if (first === -1) {
        return "";
    }
    return str.slice(first);
}

type Word = {type: string, name: string};
type Value = {type: string, value: string | number}
type Expr = {type: string, rest: string};

type Nodes = Word | Value | Expr;
function parseExpression(program: string) {
    program = skipSpace(program);
    var match: RegExpMatchArray | null, expr: Word | Value;
    if( match = /^"([^"]*)"/.exec(program)) {
        expr = {type: "value", value: match[1]};
    }else if(match = /^\d+\b/.exec(program)) {
        expr = {type: "value", value: Number(match[0])};
    }else if(match = /^[^\s(),"]+/.exec(program)) {
        expr = {type: "word", name: match[0]};
    }else{
        throw new SyntaxError("Unexpected syntax:" + program);
    }
//console.log(expr)
    return parseApply(expr, program.slice(match[0].length));
}

function parseApply(expr: Nodes, program: string) : Expr {
    //console.log("parseApply", expr);
    program = skipSpace(program);
    if( program[0] != "(") {
        return {expr: expr, rest: program};
    }

    program = skipSpace(program.slice(1));
    expr = {type: "apply", operator: expr, args: []};
    while(program[0] != ")") {
        var arg = parseExpression(program);
        expr.args.push(arg.expr);
        program = skipSpace(arg.rest);
        if(program[0] == ",") {
            program = skipSpace(program.slice(1));
        }else if(program[0] != ")") {
            throw new SyntaxError("Expected ',' or ')'");
        }
    }
    return parseApply(expr, program.slice(1));
}

function parse(program: string) {
    var result = parseExpression(program);
    if(skipSpace(result.rest).length > 0) {
        throw new SyntaxError("unexpected text after program");
    }
    return result.expr;
}

function evaluate(expr, env) {
    //console.log(expr, env);
    switch(expr.type) {
        case "value": return expr.value;
        case "word": 
            if(expr.name in env) {
                return env[expr.name];
            }else{
                throw new ReferenceError("undefined variable: " + expr.name);
            }
        case "apply":
            if( expr.operator.type == "word" && expr.operator.name in specialForms) {
                return specialForms[expr.operator.name](expr.args, env);
            }
            var op = evaluate(expr.operator, env);
            if(typeof op != "function") {
                throw new TypeError("Applying a non-function.");
            }
            return op.apply(null, expr.args.map(function(arg) {
                return evaluate(arg,env);
            }));
    }
}

var specialForms = {};

specialForms["if"] = function(args, env) {
    if(args.length != 3) {
        throw new SyntaxError("Bad number of args to if");
    }
    if(evaluate(args[0], env) !== false) {
        return evaluate(args[1], env);
    }else{
        return evaluate(args[2], env);
    }
};

specialForms["while"] = function(args, env) {
    if(args.length != 2) {
        throw new SyntaxError("bad number of args to while");
    }
    
    while(evaluate(args[0], env) !== false) {
        evaluate(args[1], env);
    }

    return false;
}

specialForms["do"] = function(args, env) {
    var value = false;
    args.forEach(function(arg) {
        value = evaluate(arg, env);
    });
    return value;
}

specialForms["define"] = function(args, env) {
    if (args.length != 2 || args[0].type != "word") {
        throw new SyntaxError("Bad use of define");
    }
    var value = evaluate(args[1], env);
    env[args[0].name] = value;
    return value;
}

specialForms["fun"] = function(args, env) {
    if (!args.length) {
        throw new SyntaxError("Functions need a body");
    }
    function name(expr) {
        if(expr.type != "word") {
            throw new SyntaxError("Arg names nust eb words");
        }
        return expr.name
    }
    var argNames = args.slice(0, args.length-1).map(name);
    var body = args[args.length - 1];

    return function(...args) {
        if(args.length !== argNames.length) {
            throw new TypeError("Wrong number of arguments")
        }
        var localEnv = Object.create(env);
        for(var i = 0; i < args.length; i++) {
            localEnv[argNames[i]] = args[i];
        }
        return evaluate(body, localEnv);
    }
}

var topEnv = {};
topEnv["true"] = true;
topEnv["false"] = false;

["+","-","*","/","==","<",">"].forEach(function(op) {
    topEnv[op] = new Function("a, b", "return a " + op + " b;");
});

topEnv["print"] = function(value) {
    console.log(value);
    return value;
}

function run(...args: string[]) {
    var env = topEnv;
    //console.log(env);
    var program = args.join("\n");
    console.log(program)
    return evaluate(parse(program), env);
}
//console.log(run("do(define(total, 0), define(count, 1), while(<(count, 11), do(define(total, +(total,count)),define(count, +(count,1)))), print(total))"));
//let result = run("do(define(total, 0),",
    //"   define(count, 1),",
    //"   while(<(count, 11),",
    //"       do(define(total, +(total, count)),",
    //"           define(count, +(count, 1)))),",
    //"   print(count))"
//);

let result = run("do(define(plusOne, fun(a, +(a, 1))), print(plusOne(10)))");
console.log(topEnv);
