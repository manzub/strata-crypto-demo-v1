/* blockchain class - handles all blockchain level functions
    - this.chain
    - chain.addBlock
    - chain.validateChain
*/

const Block = require("./block");
const { BLOCKS_DIR, ESC_STR} = require("./config");
const { saveNewBlock, utils } = require("./utils");

class Blockchain {
    constructor() {
        this.chain = [Block.genesis()]
        this.loadChain()
    }

    addBlock({ transaction }) {
        const newBlock = Block.newBlock({
            lastBlock: this.chain[this.chain.length-1],
            data:transaction
        })
        saveNewBlock(newBlock)
        this.chain.push(newBlock);
    }

    loadChain() {
        this.chain = [Block.genesis()]
        utils.readdir(BLOCKS_DIR, (err, blocks)=>{
            if(err) {
                console.log(err);
            }
            // init vars
            if(blocks[0]){
                blocks.forEach(data=>{
                    this.loadBlock(data)
                })
            }
        })
    }

    loadBlock(local) {
        utils.readFile(BLOCKS_DIR+`${local}`, (err, data)=>{
            if(err) {
                console.log(err);
            }
            // init vars
            const _line = data.toString().replaceAll(ESC_STR, ':')
            this.chain.push(JSON.parse(_line))
        })
    }
}

module.exports = Blockchain;