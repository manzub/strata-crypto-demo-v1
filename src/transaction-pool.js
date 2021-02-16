/* handles all transaction pool level functions
    - add new transaction in the pool
    - remove transaction from the pool
*/

const Transaction = require("./transaction");

class TransactionPool {
    constructor({ wallet, transaction }) {
        this.transactionPool = {}
        this.wallet = wallet
        this.transaction = transaction
    }

    clear() {
        this.transactionPool = {}
    }

    addTransaction(transaction) {
        this.transactionPool[transaction.id] = transaction;
    }

    removeTransaction(transaction) {
        let obj = Object.values(this.transactionPool)
            .filter(t => t.id !== transaction.id)
        this.clear();
        obj.forEach(elem=>this.addTransaction(elem))
    }

    validTransactions() {
        return Object.values(this.transactionPool).filter(
            transaction => this.transaction.validTransaction(
                this.wallet.fetchWallet(transaction.sender),
                transaction)
        )
    }
}

module.exports = TransactionPool;