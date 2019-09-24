# fetch-recipes
Fetch/download and extract all recipes served by a Ferdi API.

## Usage
1. Install dependencies
   
    ```sh
    yarn install
    ```
2. To use the script, use:

    ```sh
    yarn fetch <URL>
    ```
With &lt;URL> being the API URL you want to fetch from.

Recipes will be downloaded into the `recipes/` folder. `recipes/compressed` contains all compressed .tar.gz recipe files as returned by the server, `recipes/uncompressed` contains the full, uncompressed recipe.

Use `yarn fetch -h` for the full usage details.

```sh
Usage: fetch [options] <url>

Options:
  -u, --no-uncompress       Do not uncompress the recipe files
  -c, --delete-compressed   Delete compressed files after uncompressing
  -o, --output <type>       Output folder (default: "recipes")
  -r, --recipes-url <url>   Full URL to get recipes list. {url} will be replaced with the API URL. (default: "{url}/v1/recipes/")
  -d, --download-url <url>  Full URL to download recipes. {url} will be replaced with the API URL, {id} with the recipe ID. (default: "{url}/v1/recipes/download/{id}")
  -h, --help                output usage information
```

## License
This project is licensed under the [MIT license](./LICENSE)