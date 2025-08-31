# BrightBuy 

## Frontend

Frontend is built with `React` and `TypeScript`. UI components are made using `ShadCN` and `Tailwind CSS`.

### Run Frontend

To run the frontend, navigate to the `frontend` directory and use the following command:

```bash
npm install
npm run dev
```

This will start the development server and open the application in your default browser.

### Push your changes to Git

**Do not push directly to `main` (main isn't protected).**

Follow these steps to contribute:

1. Create a new branch for your changes:
    ```bash
    git checkout -b your-branch-name
    ```
2. Make your changes and stage them:
    ```bash
    git add .
    git commit -m "Describe your changes"
    ```
3. Before pushing, pull the latest changes from `main`:
    ```bash
    git pull origin main
    ```
4. Push your branch:
    ```bash
    git push origin your-branch-name
    ```
5. Go to GitHub and create a pull request from your branch to `main`.

Replace `your-branch-name` with the name of your branch.

