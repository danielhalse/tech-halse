import projectConfig from "../../CMS12/appsettings.json" assert { type: "json" };

// Define the GraphQL query to fetch StandardPages in the "Acme" category with their associated form templates
const formQuery =
`fragment FormContainerBlock on FormContainerBlock { __typename FormRenderTemplate }
query MyQuery { 
    StandardPage( where: { PrimaryCategory: { Name: { eq: "Acme" } } } ) 
    { items { Name Url MainContent { ContentLink { Expanded { ...FormContainerBlock } } } } }
}`

// Wrap the query in the expected JSON structure for the Content Graph API Request Body
const queryWrapper = `{"query":${JSON.stringify(formQuery)}}`;

// Public key access - Review security implications before using outside of local development
const publicKey = projectConfig.Optimizely.ContentGraph.SingleKey;
const graphUrl = `https://cg.optimizely.com/content/v2?auth=${publicKey}`;

const outputData = (data) => {
    const formPages = data.StandardPage.items
        .map(i => { 
            return { 
                name: i.Name, 
                url: i.Url, 
                forms: i.MainContent
                    .filter(b => b.ContentLink.Expanded.FormRenderTemplate)
                    .map(b => b.ContentLink.Expanded.FormRenderTemplate) 
                }; 
        })
        .filter(i => i.forms?.length);
    formPages.forEach(page => page.forms.forEach(f => console.log(f)));
}

const executeQuery = async () => {
    return fetch(graphUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: queryWrapper
    })
    .then((response) => {
        if (response.status >= 400) {
            throw new Error(`Error fetching data`, {cause: response});
        } else {
         return response.json();
        }
    })
    .then((data) => outputData(data.data))
    .catch(async error => {
        if (error.cause.status === 400) {
            // Graph returns JSON on most errors. Normally this is caused by a query syntax error.
            const result = await error.cause.json();
            console.log(`CODE: ${result.code}`);
            console.log(`DETAILS:\n${JSON.stringify(result.details)}`);
        }
    })
}

const result = await executeQuery();
console.log("Completed");