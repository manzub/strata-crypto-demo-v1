/* blocks class -- handles all block level functions
    -   genesisBlock()
    -   newBlock()
    -   mineBlock()
*/

const { GENESIS_BLOCK, MINE_RATE } = require("./config")
const { createNewHash } = require("./utils")
const hexToBinary = require("hex-to-binary")

class Block {
    constructor({ timestamp, lastHash, hash, data, nonce, difficulty }) {
        this.timestamp = timestamp
        this.lastHash = lastHash
        this.hash = hash
        this.nonce = nonce
        this.difficulty = difficulty
        this.data = data
    }

    static genesis(){
        return new this(GENESIS_BLOCK)
    }

    static newBlock({ lastBlock, data }) {
        let lastHash = lastBlock.hash;
        let hash, timestamp
        let { difficulty } = lastBlock
        let nonce = 0;
        do {
            nonce++;
            timestamp = Date.now()
            difficulty = Block.adjustDifficulty({orginalBlock:lastBlock, timestamp})
            hash = createNewHash({timestamp,lastHash,data,nonce,difficulty})
        } while (hexToBinary(hash).substring(0, difficulty) !== '0'.repeat(difficulty));
        return new this({ timestamp, lastHash, hash, data, nonce, difficulty })
    }

    static adjustDifficulty({ orginalBlock, timestamp }) {
        const { difficulty } = orginalBlock;
        if(difficulty < 1)return 1;
        if((timestamp - orginalBlock.timestamp) > MINE_RATE) return difficulty - 1;
        return difficulty + 1;
    }
}

module.exports = Block;