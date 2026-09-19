
async function getData() {

    return await fetch('./data.json').then(
        response => response.json().then(json => json)
    );

}

async function main() {

    const data = await getData();
    console.log(data.testNavItem);
    document.getElementById('nav-bar').appendChild(createNavItem(data.testNavItem));
    renderFamilyTreeItem({root: {name: 'Andrew Sundquist', dob: '08/13/1995', relations: [{partner: {name: 'CJ', dob: '08/13/1992'}, children: [{name: 'Catalina Sundquist', dob: '02/17/2016', children: null}] } ]}}, (person)=>Date.parse(person.dob));

}

main();

// familyTreeData ~ person, children
function renderFamilyTreeItem(familyTreeData, depthFunction=null, parentId='family-tree') {

    const svgNS = 'http://www.w3.org/2000/svg';

    const parentE = document.getElementById(parentId); 

    parentE.className += ' family-tree';

    const familyTreeSVG = document.createElementNS(svgNS, 'svg');

    const width = parentE?.clientWidth || 500;

    const height = parentE?.clientHeight || 500;

    const isVertical = (height > width) ? 1 : 0;

    familyTreeSVG.setAttribute('width', width);

    familyTreeSVG.setAttribute('height', height);

    parentE.appendChild(familyTreeSVG);

    const layers = [];

    let currentLayer = 0;

    const update = (person) => {

        console.log(layers[0]);

    }

    update(familyTreeData.root);

    if (depthFunction) {

        console.log(depthFunction(familyTreeData.root));

    }

}


// navItemData ~ text, subItems?, onclick?
function createNavItem(navItemData, level=0) {
    
    const className = `nav-bar${'-sub'.repeat(level)}-item`;

    const text = navItemData.text;

    const subItems = navItemData?.subItems;

    const onclick = navItemData?.onclick;

    const itemE = document.createElement('div');

    itemE.className = className;

    itemE.addEventListener('click', onclick);

    const spanE = document.createElement('span');

    spanE.innerText = text;

    itemE.appendChild(spanE);

    if (subItems?.length > 0) {

        const subItemBoxE = document.createElement('div');

        subItemBoxE.className = `nav-bar${'-sub'.repeat(level+1)}-box`;

        subItems.forEach(subItem => {
            
            subItemBoxE.appendChild(createNavItem(subItem, level+1));

        });

        itemE.appendChild(subItemBoxE);

    }

    return itemE

}