import { upperFirst } from 'lodash'
import 'zx/globals'

interface INode {
  title: string
  key: string
  children?: Node[]
}

type Node = INode | ILink

interface ILink {
  title: string
  href: string
  isLeaf: true
}

const trimUrl = (url: string) => {
  const ins = new URL(url)
  return ins.hostname
}

const trimReadme = (text: string) => {
  if (text.endsWith('#readme')) {
    return text.slice(0, -'#readme'.length)
  }
  return text
}

const createA = (opts: { href: string }) => {
  let { href } = opts
  const target = '_blank noopener noreferrer'

  const isGithub = href.startsWith('https://github.com')
  const project = href.slice('https://github.com/'.length)
  const text = isGithub ? trimReadme(project) : trimUrl(href)
  href = isGithub ? trimReadme(href) : href

  return `<a href="${href}" target="${target}">${text}</a>`
}

const sortCategories = (categories: Node[]) => {
  const order: Record<string, number> = {
    'nodejs': 1,
    'React': 2,
    'Vue': 3,
    'JavaScript-Utils': 4,
    '手机端': 5,
    '客户端': 6,
  }
  categories.sort((a, b) => {
    const aTitle = a.title
    const bTitle = b.title
    const aOrder = order[aTitle] || 100
    const bOrder = order[bTitle] || 100
    return aOrder - bOrder
  })
  const deleteCategory = ['JavaScript']
  const newCategories = categories.filter((node) => {
    const title = node.title
    return !deleteCategory.includes(title)
  })
  const rename: Record<string, string> = {
    'JavaScript-Utils': 'JavaScript',
  }
  newCategories.forEach((node) => {
    const title = node.title
    if (rename[title]) {
      node.title = rename[title]
    }
  })
  return newCategories
}

const run = async () => {
  const sourcePath = path.join(__dirname, '../assets/fe.json')
  const json = require(sourcePath) as INode

  const content: string[] = []
  const _categories = json.children || []
  const categories = sortCategories(_categories)

  const filterList: string[] = [
    'Collection.blog',
    'Blog.实例收集',
    'Vue.工具库.css-vars',
  ]

  const isLeafNode = (node: Node): node is ILink => {
    return 'isLeaf' in node
  }

  const titleTransform = (title: string) => {
    title = title
      .replace('/冷', '/冷门')
      .replace('/少', '/内容少')
      .replace('/老', '/陈旧')
      .replace('/旧', '/陈旧')
    return title
  }

  const getLine = (opts: { depth: number; node: Node }) => {
    const { depth, node } = opts
    const isLeaf = isLeafNode(node)
    const prefix = '  '.repeat(depth)
    const title = titleTransform(node.title)
    const text = isLeaf ? `- ${createA({ href: node.href })}` : `- ${title}`
    const line = `${prefix}${text}`
    return line
  }

  const createList = () => {
    const walk = (depth: number, node: Node, parentPath?: string): string => {
      const line = getLine({ depth, node })
      if (isLeafNode(node)) {
        return line
      }
      const children = node.children || []
      const block = [
        line,
        ...children.map((node) => {
          const newParentPath = parentPath
            ? `${parentPath}.${node.title}`
            : `${node.title}`
          const isFilter = filterList.includes(newParentPath)
          if (isFilter) {
            return null
          }
          return walk(depth + 1, node, newParentPath)
        }),
      ].filter(Boolean)
      return block.join('\n')
    }

    categories.forEach((node) => {
      const title = upperFirst(node.title)
      content.push(`## ${title}`)
      ;(node as INode).children?.forEach((node) => {
        const titlePath = `${title}.${node.title}`
        const isFilter = filterList.includes(titlePath)
        if (isFilter) {
          return
        }
        const block = walk(0, node, titlePath)
        content.push(block)
      })
    })
  }

  createList()

  const templatePath = path.join(__dirname, '../templates/README.md')
  const outputPath = path.join(__dirname, '../KOMARI.md')
  const tplContent = await fs.readFile(templatePath, 'utf-8')
  const output = tplContent.replace('{{content}}', `${content.join('\n')}\n`)
  await fs.writeFile(outputPath, output, 'utf-8')
}

run()
