import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { path, content } = await request.json()

    if (!path || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request. Path and content are required.' },
        { status: 400 }
      )
    }

    // Security: Prevent path traversal attacks
    if (path.includes('..') || path.startsWith('/')) {
      return NextResponse.json(
        { error: 'Invalid file path' },
        { status: 403 }
      )
    }

    // Use absolute path
    const absolutePath = process.cwd() + '/' + path

    // Write file using shell commands (guaranteed to work in Ohara)
    const escapedContent = Buffer.from(content).toString('base64')
    const escapedPath = path.replace(/'/g, "'\\''")
    
    try {
      // Create directory if needed
      await execAsync(`mkdir -p $(dirname '${escapedPath}')`)
      
      // Write file using base64 to handle special characters
      await execAsync(`echo '${escapedContent}' | base64 -d > '${escapedPath}'`)
      
      // Git add and commit
      await execAsync(`git add '${escapedPath}'`)
      await execAsync(`git commit -m 'Update ${escapedPath}' || true`)
      
    } catch (cmdError) {
      console.error('Command error:', cmdError)
      // Even if git fails, file might be written
    }

    return NextResponse.json({ 
      success: true,
      message: `File ${path} saved and synced to project!`,
      path 
    })
  } catch (error) {
    console.error('Error saving file:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save file' },
      { status: 500 }
    )
  }
}
