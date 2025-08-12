# Pain+ Art Therapy App Implementation Plan

## Project Overview
A web application for art therapy focusing on pain management and creative expression. The app features AI-powered image generation and reflection tools.

## Design System

### Colors
- Primary: #2e3780 (Dark Blue)
- Secondary: #ff6b35 (Orange)
- Background: #ffffff
- Text Primary: #333333
- Text Light: #ffffff

### Typography
- Font Family: Inter
- Heading Size: 40px
- Body Text: 16px

## Component Mapping

### Common Components
1. **Logo** - Brain logo with "pain+" text
   - Location: src/components/common/Logo.jsx
   - Used in: All pages header

2. **Button** - Primary action button
   - Location: src/components/common/Button.jsx
   - Variants: Primary (dark blue), Secondary

3. **TextInput** - Text input field
   - Location: src/components/forms/TextInput.jsx
   - Used in: Prompt page

### Pages

1. **Welcome Page** (Landing)
   - Figma: https://www.figma.com/design/6gmfWX9OPjCIgd6Kd3fjN5/APOTEX-Dashboards?node-id=11994-17497
   - Route: /
   - Components:
     - Logo
     - Generate Button
     - Reflect Button

2. **Mode Selection Page**
   - Figma: https://www.figma.com/design/6gmfWX9OPjCIgd6Kd3fjN5/APOTEX-Dashboards?node-id=11994-17503
   - Route: /mode
   - Components:
     - Logo
     - Create Original Work Button
     - Inspire Me Button

3. **Pain Description Page**
   - Figma: https://www.figma.com/design/6gmfWX9OPjCIgd6Kd3fjN5/APOTEX-Dashboards?node-id=11994-17534
   - Route: /describe
   - Components:
     - Logo
     - Text Input
     - Prompt Button
     - Visualize Button

## Implementation Order

### Phase 1: Base Components
1. Setup Tailwind CSS
2. Create Logo component
3. Create Button component
4. Create TextInput component
5. Setup component showcase

### Phase 2: Pages
1. Implement Welcome page
2. Implement Mode Selection page
3. Implement Pain Description page
4. Setup React Router

### Phase 3: Integration
1. Connect to Flask backend
2. Add API services
3. Implement state management
4. Add transitions and animations

## API Endpoints (Flask Backend)
- GET /api/health - Health check
- POST /api/generate - Generate art from prompt
- POST /api/reflect - Generate reflection prompts
- GET /api/inspiration - Get inspiration prompts