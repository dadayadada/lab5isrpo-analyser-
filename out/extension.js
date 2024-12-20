"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const tree_sitter_1 = __importDefault(require("tree-sitter"));
const tree_sitter_cpp_1 = __importDefault(require("tree-sitter-cpp"));
function activate(context) {
    console.log('Asymptotic Complexity Analyzer is now active!');
    let disposable = vscode.commands.registerCommand('asymptotic-complexity-analyzer.analyze', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const document = editor.document;
            const code = document.getText();
            const complexity = analyzeComplexity(code);
            vscode.window.showInformationMessage(`Asymptotic Complexity: ${complexity}`);
        }
    });
    let statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    statusBarItem.text = 'Analyze Complexity';
    statusBarItem.command = 'asymptotic-complexity-analyzer.analyze';
    statusBarItem.show();
    vscode.languages.registerCodeActionsProvider('*', {
        provideCodeActions(document, range) {
            const action = new vscode.CodeAction('Analyze Asymptotic Complexity', vscode.CodeActionKind.QuickFix);
            action.command = {
                command: 'asymptotic-complexity-analyzer.analyze',
                title: 'Analyze Asymptotic Complexity'
            };
            return [action];
        }
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
function analyzeComplexity(code) {
    return analyzeCpp(code);
}
function analyzeCpp(code) {
    const parser = new tree_sitter_1.default();
    parser.setLanguage(tree_sitter_cpp_1.default);
    const tree = parser.parse(code);
    let maxDepth = 0;
    let currentDepth = 0;
    let hasRecursion = false;
    let hasLogarithmicComplexity = false;
    let complexityMultiplier = 1;
    let loopComplexity = '';
    let algorithmComplexity = '';
    function traverse(node, parentFunctionName) {
        var _a, _b, _c;
        if (node.type === 'for_statement' || node.type === 'while_statement') {
            currentDepth++;
            maxDepth = Math.max(maxDepth, currentDepth);
            if (isLogarithmicLoop(node)) {
                hasLogarithmicComplexity = true;
                loopComplexity = 'O(log n)';
            }
            else {
                loopComplexity = `O(n^${currentDepth})`;
            }
            complexityMultiplier = currentDepth;
        }
        if (node.type === 'function_definition') {
            const functionName = (_a = node.children.find((child) => child.type === 'identifier')) === null || _a === void 0 ? void 0 : _a.text;
            if (functionName) {
                traverseFunctionBody(node, functionName);
            }
        }
        if (node.type === 'call_expression') {
            const calledFunctionName = (_b = node.children.find((c) => c.type === 'identifier')) === null || _b === void 0 ? void 0 : _b.text;
            if (calledFunctionName === 'binarySearch') {
                hasLogarithmicComplexity = true;
                algorithmComplexity = 'O(log n)';
            }
        }
        (_c = node.children) === null || _c === void 0 ? void 0 : _c.forEach((child) => traverse(child, parentFunctionName));
        if (node.type === 'for_statement' || node.type === 'while_statement') {
            currentDepth--;
        }
    }
    function traverseFunctionBody(node, functionName) {
        var _a;
        (_a = node.children) === null || _a === void 0 ? void 0 : _a.forEach((child) => {
            var _a;
            if (child.type === 'call_expression') {
                const calledFunctionName = (_a = child.children.find((c) => c.type === 'identifier')) === null || _a === void 0 ? void 0 : _a.text;
                if (calledFunctionName === functionName) {
                    hasRecursion = true;
                }
            }
        });
    }
    function isLogarithmicLoop(node) {
        const loopBody = node.children.find((child) => child.type === 'compound_statement');
        if (loopBody) {
            const hasDivision = loopBody.children.some((child) => child.text.includes('/'));
            const hasBinarySearch = loopBody.children.some((child) => child.text.includes('binarySearch'));
            return hasDivision || hasBinarySearch;
        }
        return false;
    }
    traverse(tree.rootNode);
    const algorithmResult = analyzeAlgorithm(code);
    if (algorithmResult) {
        return algorithmResult;
    }
    if (hasLogarithmicComplexity && complexityMultiplier > 1) {
        return `O(n log n)`;
    }
    if (hasLogarithmicComplexity) {
        return 'O(log n)';
    }
    if (maxDepth == 0)
        return 'O(1)';
    const complexity = maxDepth > 1 ? `O(n^${maxDepth})` : `O(n)`;
    if (hasRecursion) {
        return `O(n^${maxDepth + 1})`;
    }
    return complexity;
}
function analyzeAlgorithm(code) {
    if (/quicksort/.test(code) || /partition.*pivot/.test(code) || /quickSort/.test(code)) {
        return 'O(n log n)';
    }
    if (/mergesort/.test(code) || /merge.*recursive/.test(code) || /mergeSort/.test(code)) {
        return 'O(n log n)';
    }
    if (/heapsort/.test(code) || /heapify/.test(code)) {
        return 'O(n log n)';
    }
    return '';
}
