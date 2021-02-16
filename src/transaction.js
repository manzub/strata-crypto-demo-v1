/* transaction class - handles all trnasaction level functions
    - new transaction
    - is valid transaction
*/

const { verifySignature } = require("./utils");
const { newTransactionMap } = require("./wallet");

class Transaction {
    constructor() {}

    createTransaction({ sender, recipient, amount }) {
        // check if sender and recipient addresses exist
        if(sender.publicKey && recipient.publicKey && sender!=recipient) {
            if(sender.balance > amount) {
                let transaction = newTransactionMap({
                    senderWallet:sender,
                    transaction: {
                        sender: sender.id,
                        recipient: recipient.id,
                        amount
                    }
                })
                return transaction;
            }
        }
    }

    validTransaction(senderWallet, transaction) {
        let signature = transaction.signature;
        let tr = {  
            sender:transaction.sender, 
            recipient:transaction.recipient, 
            amount:transaction.amount 
        };
        if(verifySignature({ senderWallet, transaction:tr, signature })) {
            if(senderWallet.balance > tr.amount) {
                return true;
            }
        }
        return false;
    }
}

module.exports = Transaction;