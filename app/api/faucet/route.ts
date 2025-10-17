import { NextRequest, NextResponse } from 'next/server'
import { Connection, PublicKey, Keypair, Transaction, sendAndConfirmTransaction } from '@solana/web3.js'
import { getOrCreateAssociatedTokenAccount, createTransferInstruction } from '@solana/spl-token'
import bs58 from 'bs58'
import { prisma } from '@/lib/prisma'

const SOLANA_NETWORK = 'https://api.devnet.solana.com'
const MINT_ADDRESS = 'HtnUp4FXaKC7MvpWP2N8W25rea75XspMiiw3XEixE8Jd'

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json()

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 })
    }

    try {
      const destination = new PublicKey(address)
    } catch (e) {
      return NextResponse.json({ error: 'Invalid address' }, { status: 400 })
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

    const privateKey = process.env.PRIVATE_KEY
    if (!privateKey) {
      return NextResponse.json({ error: 'Private key not configured' }, { status: 500 })
    }

    // Create or update claim record
    await prisma.claimRecord.upsert({
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
      const connection = new Connection(SOLANA_NETWORK)
      const secretKey = bs58.decode(privateKey)

      if (secretKey.length !== 64) {
        return NextResponse.json({ error: 'Invalid private key size. Must be a 64-byte secret key.' }, { status: 500 })
      }

      const signer = Keypair.fromSecretKey(secretKey)

      const mint = new PublicKey(MINT_ADDRESS)
      const destination = new PublicKey(address)

      const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        signer,
        mint,
        signer.publicKey
      )

      console.log('From Token Account:', fromTokenAccount.address.toBase58())

      const toTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        signer,
        mint,
        destination
      )

      const transaction = new Transaction().add(
        createTransferInstruction(
          fromTokenAccount.address,
          toTokenAccount.address,
          signer.publicKey,
          500000 // 500 tokens with 3 decimals
        )
      )

      const signature = await sendAndConfirmTransaction(connection, transaction, [signer])

      return NextResponse.json({
        success: true,
        message: 'Tokens claimed successfully',
        transactionHash: signature
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
      if (txError instanceof Error) {
        return NextResponse.json({ error: txError.message, name: txError.name, stack: txError.stack }, { status: 500 })
      }
      return NextResponse.json(
        { error: 'Failed to send tokens. Please try again.' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Faucet error:', error)
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message, name: error.name, stack: error.stack }, { status: 500 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
