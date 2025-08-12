# Implementation Prompt

## Overview
This prompt guides Claude through implementing a frontend WebApp from Figma designs, using a structured approach with MCP servers.

## Full Prompt

```markdown
We are going to implement the frontend of our WebApp. We have designed it in Figma.

Here are the steps of instructions:
First setup the directory, lets create a react frontend. 
Setup a react project through vite with javascript => example here: npm create vite@latest my-app -- --template react
Organize the folders so we have a pages and components directories, handle a gitignore also.

src/
├── components/          // UI Components (parallel creation)
│   ├── common/         // Shared components
│   ├── forms/          // Form components
│   └── layout/         // Layout components
├── pages/              // Page components (parallel)
├── hooks/              // Custom hooks (parallel)
├── services/           // API services (parallel)
├── store/              // State management
├── utils/              // Utility functions
└── styles/             // Styling files

Lets use Sequential-Thinking MCP => to organize the thoughts throughout the project

Second utilize the figma mcp dev server to access these components/pages 
- MT2 Section with all the page components: https://www.figma.com/design/pk8kgMgrhMjWSUD5lI8sVk/MT2-Wireframe?node-id=1142-4103&m=dev
- Components section - https://www.figma.com/design/pk8kgMgrhMjWSUD5lI8sVk/MT2-Wireframe?node-id=1104-1863&m=dev
From these figma designs, create an implementation plan for each page/component.
If you can create a mapping of components/pages/sections with their figma links. This will be used to review later

Now we can start implementing:
Start with the components first => ensure correctness by having componentshowcase route 
Then we can implement the pages, setup the routes correctly 
```

## Key Instructions

1. **Project Setup**
   - Use Vite with React JavaScript template
   - Create organized folder structure
   - Setup proper .gitignore

2. **Planning Phase**
   - Use Sequential-Thinking MCP for project organization
   - Access Figma designs via MCP dev server
   - Create component/page mapping with Figma links

3. **Implementation Order**
   - Components first (bottom-up approach)
   - Create componentshowcase route for testing
   - Pages implementation after components
   - Setup routing correctly

## Expected Outcomes

- Well-structured React application
- Component showcase for easy testing
- Proper documentation in docs/ folder
- Figma-to-code mapping for review