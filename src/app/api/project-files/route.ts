import { NextResponse } from 'next/server'
import { readdir, readFile, stat } from 'fs/promises'
import { join } from 'path'

interface FileData {
  path: string
  content: string
}

async function getAllFiles(dir: string, basePath: string = ''): Promise<FileData[]> {
  const files: FileData[] = []
  
  try {
    const entries = await readdir(dir, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name
      
      // Skip node_modules, .next, .git, and other build/cache directories
      if (entry.name === 'node_modules' || 
          entry.name === '.next' || 
          entry.name === '.git' ||
          entry.name === 'dist' ||
          entry.name === 'build' ||
          entry.name === '.vercel' ||
          entry.name === 'coverage') {
        continue
      }
      
      if (entry.isDirectory()) {
        const subFiles = await getAllFiles(fullPath, relativePath)
        files.push(...subFiles)
      } else {
        // Only read text files (skip binary files like images, fonts, etc.)
        const ext = entry.name.split('.').pop()?.toLowerCase()
        const textExtensions = [
          'ts', 'tsx', 'js', 'jsx', 'json', 'md', 'txt', 'css', 'scss', 
          'html', 'yml', 'yaml', 'env', 'gitignore', 'prettierrc', 'eslintrc'
        ]
        
        if (textExtensions.includes(ext || '')) {
          try {
            const content = await readFile(fullPath, 'utf-8')
            files.push({
              path: relativePath,
              content
            })
          } catch (error) {
            console.error(`Error reading file ${relativePath}:`, error)
            files.push({
              path: relativePath,
              content: '// Error reading file'
            })
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error)
  }
  
  return files
}

export async function GET() {
  try {
    const projectRoot = process.cwd()
    
    // Get ALL files from project root (this will recursively scan everything)
    // The getAllFiles function already skips node_modules, .next, .git, etc.
    const allProjectFiles = await getAllFiles(projectRoot, '')
    
    return NextResponse.json({
      success: true,
      files: allProjectFiles,
      count: allProjectFiles.length
    })
  } catch (error) {
    console.error('Error fetching project files:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch project files',
        files: []
      },
      { status: 500 }
    )
  }
}
