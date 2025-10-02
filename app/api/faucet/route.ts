import { NextRequest, NextResponse } from 'next/server'
import { Aptos, AptosConfig, Network, Account, Ed25519PrivateKey } from '@aptos-labs/ts-sdk'
import { prisma } from '@/lib/prisma'

// Initialize Aptos client
const config = new AptosConfig({ 
  network: (process.env.APTOS_NETWORK as Network) || Network.TESTNET 
})
const aptos = new Aptos(config)

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json()

    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      )
    }

    // Check if address has already claimed
    const existingRecord = await prisma.claimRecord.findUnique({
      where: { address }
    })

    if (existingRecord && existingRecord.claimed) {
      return NextResponse.json(
        { error: 'Address has already claimed tokens' },
        { status: 400 }
      )
    }

    // Get the private key from environment
    const privateKey = process.env.APTOS_PRIVATE_KEY
    if (!privateKey) {
      return NextResponse.json(
        { error: 'Private key not configured' },
        { status: 500 }
      )
    }

    // Create or update claim record
    const claimRecord = await prisma.claimRecord.upsert({
      where: { address },
      update: { 
        claimed: true,
        claimedAt: new Date()
      },
      create: {
        address,
        claimed: true,
        claimedAt: new Date()
      }
    })

    try {
      // Create Account from private key
      const privateKeyBytes = new Ed25519PrivateKey(privateKey)
      const senderAccount = Account.fromPrivateKey({ privateKey: privateKeyBytes })
      
      // Send tokens using Aptos SDK
      const amount = process.env.BOSON_CLAIM_AMOUNT || '1000000000' // 10 BOSON tokens (with 8 decimals: 10 * 10^8)
      const coinType = (process.env.BOSON_TOKEN_ADDRESS) as `${string}::${string}::${string}`
      
      const transaction = await aptos.transferCoinTransaction({
        sender: senderAccount.accountAddress,
        recipient: address,
        amount: BigInt(amount),
        coinType: coinType
      })

      const committedTransaction = await aptos.signAndSubmitTransaction({
        signer: senderAccount,
        transaction
      })

      await aptos.waitForTransaction({
        transactionHash: committedTransaction.hash
      })

      return NextResponse.json({
        success: true,
        message: 'Tokens claimed successfully',
        transactionHash: committedTransaction.hash,
        amount: amount
      })

    } catch (txError) {
      // If transaction fails, revert the database record
      await prisma.claimRecord.update({
        where: { address },
        data: { 
          claimed: false,
          claimedAt: null
        }
      })

      console.error('Transaction failed:', txError)
      return NextResponse.json(
        { error: 'Failed to send tokens. Please try again.' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Faucet error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
