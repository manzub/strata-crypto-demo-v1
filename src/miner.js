/* transaction pool miner
    -   mine a transaction in the pool

*/


class Miner {
    constructor({ transactionPool, blockchain, wallet }) {
        this.blockchain = blockchain
        this.transactionPool = transactionPool
        this.wallet = wallet
    }

    mineTransaction(walletId) {
        const validTransactions = this.transactionPool.validTransactions();
        const randTransaction = validTransactions[Math.floor(Math.random()*validTransactions.length)]
        const { sender, recipient, amount } = randTransaction;
        this.blockchain.addBlock({ transaction:randTransaction })
        this.transactionPool.removeTransaction(randTransaction)
        this.wallet.rewardTransaction(walletId)
        return { sender, recipient, amount };
    }
}

module.exports = Miner;