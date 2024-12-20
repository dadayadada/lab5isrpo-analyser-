import * as vscode from 'vscode';
import Parser from 'tree-sitter';
import Cpp from 'tree-sitter-cpp';

export function activate(context: vscode.ExtensionContext) {
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

export function deactivate() {}

function analyzeComplexity(code: string): string {
    return analyzeCpp(code);
}

function analyzeCpp(code: string): string {
    const parser = new Parser();
    parser.setLanguage(Cpp);

    const tree = parser.parse(code);
    let maxDepth = 0; 
    let currentDepth = 0; 
    let hasRecursion = false;
    let hasLogarithmicComplexity = false; 
    let complexityMultiplier = 1; 
    let loopComplexity = ''; 
    let algorithmComplexity = ''; 

    function traverse(node: any, parentFunctionName?: string) {
        if (node.type === 'for_statement' || node.type === 'while_statement') {
            currentDepth++; 
            maxDepth = Math.max(maxDepth, currentDepth); 
            
            if (isLogarithmicLoop(node)) {
                hasLogarithmicComplexity = true;
                loopComplexity = 'O(log n)';
            } else {
                loopComplexity = `O(n^${currentDepth})`;
            }

          
            complexityMultiplier = currentDepth;
        }

        if (node.type === 'function_definition') {
            const functionName = node.children.find((child: any) => child.type === 'identifier')?.text;
            if (functionName) {
                traverseFunctionBody(node, functionName);
            }
        }

        if (node.type === 'call_expression') {
            const calledFunctionName = node.children.find((c: any) => c.type === 'identifier')?.text;
            if (calledFunctionName === 'binarySearch') {
                hasLogarithmicComplexity = true; 
                algorithmComplexity = 'O(log n)';
            }
        }

        node.children?.forEach((child: any) => traverse(child, parentFunctionName));

        if (node.type === 'for_statement' || node.type === 'while_statement') {
            currentDepth--; 
        }
    }

    function traverseFunctionBody(node: any, functionName: string) {
        node.children?.forEach((child: any) => {
            if (child.type === 'call_expression') {
                const calledFunctionName = child.children.find((c: any) => c.type === 'identifier')?.text;
                if (calledFunctionName === functionName) {
                    hasRecursion = true; 
                }
            }
        });
    }

    function isLogarithmicLoop(node: any): boolean {
       
        const loopBody = node.children.find((child: any) => child.type === 'compound_statement');
        if (loopBody) {
            const hasDivision = loopBody.children.some((child: any) => child.text.includes('/'));
            const hasBinarySearch = loopBody.children.some((child: any) => child.text.includes('binarySearch'));
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

    if (maxDepth == 0 )
        return 'O(1)';
    const complexity = maxDepth > 1 ? `O(n^${maxDepth})` : `O(n)`;

   
    if (hasRecursion) {
        return `O(n^${maxDepth + 1})`;
    }

    return complexity;
}
function analyzeAlgorithm(code: string): string {
   
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




