import '../styles/tree.css';

type NodeData = {name:string, relationships?:{partner:string, children?:string[]}[]}

export default class Tree<D extends NodeData> {

    #depthArray:TreeNode<D>[][] = [];

    #parentE?:HTMLElement;
    #svgE?:SVGElement;

    #width:number=0;
    #height:number=0;

    #unitRatio:number=1;
    #unitX:number=0;
    get #unitY():number {return this.#unitX*this.#unitRatio};

    #positionX:number=0;
    #positionY:number=0;
    #scrollNumber:number=1;

    #scaleFactor:number=1;

    #maxScrollNumber:number=10;
    get #maxX():number {return this.#width*(this.#scrollNumber-1)/2};
    get #maxY():number {return this.#height*(this.#scrollNumber-1)/2};

    #isMoving:boolean=false;
    #isClicking:boolean=false;

    get maxDepth():number {return this.#depthArray.length}
    rankAtDepth(depth:number):number {return this.#depthArray[depth].length}
    get maxRank():number {return Math.max(...this.#depthArray.map(depthRow=>depthRow.length))}
    get box():([number, number][])[] {return Array.from(Array(this.maxDepth)).map((_, i)=>Array.from(Array(this.maxRank)).map((_, j)=>[i, j]))}

    find(name:string):TreeNode<D>|undefined {

        for (const rank of this.#depthArray) {
            const nodeReturn = rank.find(node=>node.data.name===name);
            if (nodeReturn) {
                return nodeReturn
            }
        }
    }

    e(t:string, i?:string, c?:string, a?:{[p:string]:string}) {
        const e = document.createElement(t);
        e.id = i||'';
        e.className = c||'';
        Object.entries(a||{}).forEach(([k, v])=>{
            e.setAttribute(k, v);
        });
        return e
    }

    s(t:string, i?:string, c?:string, a?:{[p:string]:string}) {
        const s = document.createElementNS("http://www.w3.org/2000/svg", t);
        s.id = i||'';
        if (c) s.classList.add(c);
        Object.entries(a||{}).forEach(([k,v])=>{
            s.setAttribute(k, v);
        });
        return s
    }

    p(d:string, i?:string, c?:string) {
        const p = this.s('path', i, c);
        p.setAttribute('d', d);
        return p
    }

    draw(parentEId:string) {
        if (!this.#depthArray.length) {throw new Error(`no depth array`)}
        const parentEQ = document.getElementById(parentEId);
        if (!parentEQ) throw new Error(`parent element not found - ${parentEId}`);
        this.#parentE = parentEQ;
        this.#parentE.className += ' tree-parent';
        this.#width = this.#parentE.clientWidth;
        this.#height = this.#parentE.clientHeight;
        this.#svgE = this.s('svg', parentEId + '-svg', 'tree-svg', {viewBox:`${-this.#width/2} ${-this.#height/2} ${this.#width} ${this.#height}`});
        this.#svgE.appendChild(this.p(`M ${-this.#width/2} ${-this.#height/2} l ${this.#width} 0 l 0 ${this.#height} l ${-this.#width} 0 z`, '', 'tree-node'));
        this.#unitX = this.#height>this.#width/(this.maxRank+2)*this.#unitRatio*(this.maxDepth+2*this.#unitRatio)?this.#width/(this.maxRank+2):this.#height/(this.maxDepth+2*this.#unitRatio);
        // this.box.forEach((depthRow)=>depthRow.forEach(([depth, rank])=>{
        //     this.#svgE?.appendChild(this.p(`M ${this.#unitX*(rank-this.maxRank/2)} ${this.#unitY*(depth-this.maxDepth/2)} l ${this.#unitX} 0 l 0 ${this.#unitY} l ${-this.#unitX} 0 z`, '', 'tree-node'));
        // }));
        const r = .75;
        this.#depthArray.toReversed().forEach((depthRow, depthBackwards)=>{
                const depth = this.maxDepth-depthBackwards-1;
                const cellSizeX = this.#unitX;
                const cellSizeY = this.#unitY;
                const boxPositionY = this.#unitY*(depth-this.maxDepth/2);
                const extraSpaceRatio = (this.maxRank/(depthRow.length)-1);
                const boxMarginX = (1-r)/2*this.#unitX;
                const boxMarginY = (1-r)/2*this.#unitY;
                const boxSizeX = r*this.#unitX;
                const boxSizeY = r*this.#unitY;
                const treeStubY = (1-r)/3*this.#unitY;
                depthRow.forEach((node, rank)=>{
                    const boxPositionX = this.#unitX*(rank-this.maxRank/2+extraSpaceRatio*(rank+1/2));
                    const spaceBetweenCellX = extraSpaceRatio*cellSizeX;
                    const numberOfRelationships = node.data.relationships?.length||1;
                    const nodePathE = this.p(`
                        M ${boxPositionX+boxMarginX} ${boxPositionY+boxMarginY} 
                        l ${r*this.#unitX} 0 
                        l 0 ${r*this.#unitY} 
                        l ${-r*this.#unitX} 0 z`,
                        '', 'tree-node');
                    const subStrings = node.data.name.split(' ');
                    const subStringsToPrint = [subStrings[0]].concat(subStrings.splice(1).join(' '));
                    subStringsToPrint.forEach((subString, textRowNumber)=>{
                        const textAlignmentX = 1;
                        const textAlignmentY = 12*(1+textRowNumber); // simple fix - needs adjusting 
                        const text = this.s('text', '', '', {x: `${boxPositionX+boxMarginX+textAlignmentX}`, y: `${boxPositionY+boxMarginY+textAlignmentY}`});
                        text.innerHTML = subString;
                        this.#svgE?.appendChild(text);
                    });
                    this.#svgE?.appendChild(nodePathE);
                    node.data.relationships?.forEach((relationship, relationshipNumber)=>{
                        const relationshipSpacer = treeStubY/(numberOfRelationships-1);
                        const relationshipOffset1 = relationshipNumber*relationshipSpacer;
                        const relationshipOffset2 = (numberOfRelationships/2-relationshipNumber)*relationshipSpacer;
                        const partnerConnectionPathE = relationshipNumber===0? this.p(`
                            M ${boxPositionX+boxMarginX+boxSizeX} ${boxPositionY+boxMarginY+boxSizeY/2} 
                            l ${spaceBetweenCellX+2*boxMarginX} 0`,
                            '', 'tree-node'):
                            this.p(`
                                M ${boxPositionX+boxMarginX+boxSizeX} ${boxPositionY+cellSizeY/2-relationshipOffset1} 
                                l ${spaceBetweenCellX/2+boxMarginX+relationshipOffset2} 0
                                l 0 ${boxMarginY-cellSizeY/2}
                                l ${relationshipNumber*(spaceBetweenCellX+cellSizeX)-relationshipOffset2} 0
                                l 0 ${cellSizeY/2-boxMarginY+relationshipOffset1}
                                l ${spaceBetweenCellX/2+boxMarginX} 0
                                `, '', 'tree-node');
                            this.#svgE?.appendChild(partnerConnectionPathE);
                        relationship.children?.forEach(child=>{
                            const extraSpaceRatioNextDepth = (this.maxRank/(this.rankAtDepth(depth+1))-1);
                            const childRank = this.find(child)!.rank;
                            const childDepth = depth+1;
                            const childBoxPositionX = (childRank-this.maxRank/2+extraSpaceRatioNextDepth*(childRank+1/2))*cellSizeX;
                            const childBoxPositionY = (childDepth-this.maxDepth/2)*this.#unitY;
                            const childConnectionPathE = this.p(`
                                M ${boxPositionX+cellSizeX+spaceBetweenCellX/2+relationshipNumber*(spaceBetweenCellX+cellSizeX)} ${boxPositionY+cellSizeY/2}
                                l 0 ${cellSizeY/2-boxMarginY+treeStubY/2}
                                L ${childBoxPositionX+cellSizeX/2} ${childBoxPositionY+boxMarginY-treeStubY}
                                l 0 ${treeStubY}`,
                                '', 'tree-node');
                            this.#svgE?.appendChild(childConnectionPathE);
                        });
                    });
                });
            }
        );
        this.#parentE.appendChild(this.#svgE);
        this.#updateTransform();
        this.#svgE.addEventListener('wheel', this.#handleScroll);
        this.#svgE.addEventListener('mousedown', this.#handleMouseDown);
        this.#svgE.addEventListener('mouseup', this.#handleMouseUp);
        this.#svgE.addEventListener('mousemove', this.#handleMouseMove);

    }



    #updateTransform() {this.#svgE?.setAttribute('transform', `matrix(
        ${this.#scaleFactor*this.#scrollNumber} 0 0 ${this.#scaleFactor*this.#scrollNumber} ${this.#positionX} ${this.#positionY})`)}

    #bound() {
        this.#scrollNumber = this.#scrollNumber<1? 1: (this.#scrollNumber>this.#maxScrollNumber? this.#maxScrollNumber: this.#scrollNumber);
        this.#positionX = this.#positionX>this.#maxX? this.#maxX: (this.#positionX<-this.#maxX?-this.#maxX: this.#positionX);
        this.#positionY = this.#positionY>this.#maxY? this.#maxY: (this.#positionY<-this.#maxY?-this.#maxY: this.#positionY);
    }

    #handleScroll = (event:WheelEvent) => {
        this.#positionX=this.#positionX/this.#scrollNumber;
        this.#positionY=this.#positionY/this.#scrollNumber;
        this.#scrollNumber += event.deltaY > 0? -1: 1;
        this.#positionX=this.#positionX*this.#scrollNumber;
        this.#positionY=this.#positionY*this.#scrollNumber;
        this.#bound();
        this.#updateTransform();
    }

    #handleMouseDown = () => {
        this.#isMoving = true;
    }

    #handleMouseUp = () => {
        this.#isMoving = false;
    }
    
    #handleMouseMove = (event:MouseEvent) => {
        if (this.#isMoving) {
            this.#positionX += event.movementX;
            this.#positionY += event.movementY;
            this.#bound();
            this.#updateTransform();
            console.log(this.#positionX, this.#positionY)
        }
    }

    //person ~ { name:string, relationships: {partner:string, children: string[]}[], ...other properties }
    static fromFlat<D extends NodeData>(dataArray:D[], rootName:string, maxDepth:number=-1) {
        const tree = new Tree;
        const createNode = (name:string, depth:number) => {
            const data = dataArray.find(dataFind=>dataFind.name===name);
            if (!data) throw new Error(`invalid data array - cannot find child - ${name}`);
            if ((!tree.#depthArray[depth])||(!tree.#depthArray[depth].length)) {tree.#depthArray[depth]=[]}
            const rank = tree.#depthArray[depth].length;
            tree.#depthArray[depth].push(TreeNode.from(data, depth, rank));
            data.relationships?.forEach((relationship, index)=>{
                const partnerData = dataArray.find(dataOther=>dataOther.name===relationship.partner);
                if (!partnerData) throw new Error(`invalid data array - cannot find related partner - ${relationship.partner}`);
                tree.#depthArray[depth].push(TreeNode.from(partnerData, depth, rank + index + 1));
                relationship?.children?.forEach(child=>createNode(child, depth+1));
            });
        }
        createNode(rootName, 0);
        return tree
    }

    static TEST_DATA = [
        {name:'Andrew Sundquist', relationships:[{partner: 'Partner One', children: ['Catalina Sundquist']}, {partner:'Michael Chapman', children:['Aaron']}]}, //{partner:'Jaba the Hut', children: ['Catalina Sundquist']},
        {name:'Patrick Sundquist', relationships:[{partner:'Kj Olson', children:['Tubby', 'Romeo', 'Luna']}]},
        {name:'Thomas Sundquist'},
        {name:'Katherine Sundquist', relationships:[{partner:'Thomas Sundquist', children: ['Patrick Sundquist', 'Andrew Sundquist']}]},
        {name:'Catalina Sundquist'},
        {name:'Partner One'},
        // {name:'Jaba the Hut'},
        {name:'Aaron'},
        {name:'Michael Chapman'},
        {name:'Kj Olson'},
        {name:'Tubby'},
        {name:'Romeo'},
        {name:'Luna'},
    ]

}

class TreeNode<D extends NodeData> {

    data!:D;
    depth!:number;
    rank!:number;

    static from<D extends NodeData>(data:D, depth:number, rank:number) {

        const treeNode = new TreeNode();
        treeNode.data = data;
        treeNode.depth = depth;
        treeNode.rank = rank;
        return treeNode

    }

}

