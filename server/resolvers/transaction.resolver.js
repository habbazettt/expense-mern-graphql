import Transaction from "../model/transaction.model.js"

const transactionResolver = {
    Query: {
        transactions: async (_, __, context) => {
            try {
                if (!context.getUser()) {
                    throw new Error('Unauthorized')
                }

                const userId = await context.getUser()._id

                const transactions = await Transaction.find({ userId: userId })
                return transactions
            } catch (error) {
                console.log('Error in transactions:', error);
                throw new Error(error.message)
            }
        },
        transaction: async (_, { transactionId }) => {
            try {
                const transaction = await Transaction.findById(transactionId)
                return transaction
            } catch (error) {
                console.log('Error in transaction by id:', error);
                throw new Error(error.message)
            }
        },
        // TODO Add categorieStatistic query
    },
    Mutation: {
        createTransaction: async (_, { input }, context) => {
            try {
                const newTransaction = new Transaction({
                    ...input,
                    userId: context.getUser()._id
                })

                await newTransaction.save()
                return newTransaction
            } catch (error) {
                console.log('Error in createTransaction:', error);
                throw new Error(error.message)
            }
        },
        updateTransaction: async (_, { input }) => {
            try {
                const updatedTransaction = await Transaction.findByIdAndUpdate(input.transactionId, input, { new: true })
                return updatedTransaction
            } catch (error) {
                console.log('Error in updateTransaction:', error);
                throw new Error(error.message)
            }
        },
        deleteTransaction: async (_, { transactionId }) => {
            try {
                const deletedTransaction = await Transaction.findByIdAndDelete(transactionId)
                return deletedTransaction
            } catch (error) {
                console.log('Error in deleteTransaction:', error);
                throw new Error(error.message)
            }
        }
    },
    // TODO Add transaction/user relationship
}

export default transactionResolver