import 'zx/globals'

const run = async () => {
  await fs.remove(path.join(__dirname, '../.git'))
  await $`git init`
  await $`git remote add origin https://github.com/fz6m/komari.git`
  await $`git add .`
  await $`git commit -m "deploy"`
  await $`git push -f origin main`
}

run()
