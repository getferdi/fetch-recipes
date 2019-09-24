/**
 * Fetch all recipes from a Ferdi API
 * 
 * @copyright 2019 The Ferdi Team
 * @link https://github.com/getferdi/fetch-recipes
 */
const fetch = require('node-fetch');
const program = require('commander');
const fs = require('fs-extra');
const path = require('path');
const targz = require('targz');
const Spinner = require('cli-spinner').Spinner;
const Progress = require('cli-progress');

// Start commander
let api;
program
  .arguments('<url>')
  .option('-u, --no-uncompress', 'Don\'t uncompress the recipe files')
  .option('-c, --delete-compressed', 'Delete compressed files after uncompressing')
  .option('-o, --output <type>', 'Output folder', 'recipes')
  .option('-r, --recipes-url <url>', 'Full URL to get recipes list. {url} will be replaced with the API URL.', '{url}/v1/recipes/')
  .option('-d, --download-url <url>', 'Full URL to download recipes. {url} will be replaced with the API URL, {id} with the recipe ID.', '{url}/v1/recipes/download/{id}')
  .action(function (url) {
    api = url;
  })
  .parse(process.argv);

if (!api) {
    console.log('Please provide a URL to fetch from. Use --help to get more information.');
    return;
}

// Create Config
const config = {
    recipesList: program.recipesUrl.replace('{url}', api),
    download: program.downloadUrl.replace('{url}', api),
}

// Helper: Download file to filesystem
const downloadFile = (async (url, path) => {
    const res = await fetch(url);
    const fileStream = fs.createWriteStream(path);
    await new Promise((resolve, reject) => {
        res.body.pipe(fileStream);
        res.body.on("error", (err) => {
            reject(err);
        });
        fileStream.on("finish", function () {
            resolve();
        });
    });
});

// Helper: Decompress .tar.gz file
const decompress = (src, dest) => {
    return new Promise(resolve => {
        targz.decompress({
            src,
            dest
        }, function (err) {
            if (err) {
                console.log('Error while decompressing recipe:', err);
            }
            resolve();
        });
    })
}

// Let us work in an async environment
(async () => {
    // Check that output folders exists
    if (!await fs.exists(program.output)) {
        console.log('Recipes directory doesn\'t exist - Creating...');
        await fs.mkdir(program.output);
    }
    if (!await fs.exists(path.join(program.output, 'compressed'))) {
        await fs.mkdir(path.join(program.output, 'compressed'));
    }
    if (!await fs.exists(path.join(program.output, 'uncompressed')) && program.uncompress) {
        await fs.mkdir(path.join(program.output, 'uncompressed'));
    }

    // Fetch list of all recipes
    spinner = new Spinner('Getting list of recipes');
    spinner.setSpinnerString(18);
    spinner.start();

    const recipes = await (await fetch(config.recipesList)).json();
    const totalRecipes = recipes.length;

    spinner.stop();

    console.log(`\nFound ${totalRecipes} recipes`)

    // Fetch recipes
    let downloadedRecipes = 0;

    const progress = new Progress.SingleBar({}, Progress.Presets.shades_classic);
    progress.start(totalRecipes, 0);

    recipes.forEach(async recipe => {
        // Get path for compressed and uncompressed files
        const compressed = path.join(program.output, 'compressed', `${recipe.id}.tar.gz`);
        const uncompressed = path.join(program.output, 'uncompressed', recipe.id);

        let error = false;

        // Download recipe to filesystem
        try {
            await downloadFile(
                config.download.replace('{id}', recipe.id),
                compressed
            );
        } catch(e) {
            console.log(`Could not download ${recipe.id}`);
            error = true;
        }
        

        // Extract recipe file
        if (program.uncompress && !error) {
            await decompress(compressed, uncompressed)
        }

        // Check progress
        progress.increment();
        downloadedRecipes++;
        if (downloadedRecipes >= totalRecipes) {
            // We are done - stop progess bar
            progress.stop();

            // Remove compressed files
            if (program.deleteCompressed) {
                console.log('Removing compressed files');
                await fs.remove(path.join(program.output, 'compressed'));
            }

            console.log(`Done. Got ${totalRecipes} recipes. Saved into ${program.output}`);
        }
    });
})();