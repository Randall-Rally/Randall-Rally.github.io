import Tree from './tree'; './tree';
import '../styles/index.css';


function main() {

    const testTree = Tree.fromFlat(Tree.TEST_DATA, 'Katherine Sundquist');

    console.log(testTree);

    testTree.draw('family-tree');

}

main();
