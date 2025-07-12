# My Blog

A simple, elegant personal blog with a retro aesthetic. Built with vanilla HTML, CSS, and JavaScript.

## Features

- **Timeline View**: See all your posts in chronological order
- **Create Posts**: Write and publish new articles with titles, content, and tags
- **Edit Posts**: Modify existing posts with the same form interface
- **Delete Posts**: Remove posts with confirmation dialog
- **Retro Design**: Clean, vintage-inspired styling with monospace fonts and subtle patterns
- **Local Storage**: Posts are saved locally in your browser
- **Responsive**: Works on desktop and mobile devices
- **Keyboard Shortcuts**: 
  - `Ctrl/Cmd + N`: Create new post
  - `Ctrl/Cmd + T`: Go to timeline

## How to Use

1. **View Posts**: Click "Timeline" to see all your published posts
2. **Create a Post**: 
   - Click "New Post" 
   - Fill in the title and content
   - Add optional tags (comma-separated)
   - Click "Publish Post"
3. **Edit a Post**:
   - Click the "Edit" button on any post
   - Modify the title, content, or tags
   - Click "Update Post" to save changes
4. **Delete a Post**:
   - Click the "Delete" button on any post
   - Confirm the deletion in the dialog
5. **About**: Click "About" to see blog statistics

## Design Features

- **Typography**: Uses Courier Prime (monospace) and Playfair Display (serif) fonts
- **Color Scheme**: Warm beige background with dark text for easy reading
- **Layout**: Clean, centered design with subtle borders and shadows
- **Animations**: Smooth transitions and hover effects
- **Pattern**: Subtle dot pattern background for vintage feel
- **Action Buttons**: Edit (blue hover) and Delete (red hover) buttons for each post

## File Structure

- `index.html` - Main HTML structure
- `style.css` - Retro styling and responsive design
- `script.js` - Blog functionality and interactions

## Getting Started

Simply open `index.html` in your web browser to start using the blog. Your posts will be automatically saved to your browser's local storage.

## Publishing Your Blog Online

### Option 1: GitHub Pages (Recommended)

1. **Create a GitHub account** at [github.com](https://github.com) if you don't have one
2. **Create a new repository**:
   - Go to GitHub and click "New repository"
   - Name it something like `my-blog`
   - Make it public
   - Don't initialize with README (we already have one)
3. **Upload your files**:
   - Click "uploading an existing file"
   - Drag and drop your `index.html`, `style.css`, `script.js`, and `README.md` files
   - Commit the changes
4. **Enable GitHub Pages**:
   - Go to your repository Settings
   - Scroll down to "Pages" section
   - Under "Source", select "Deploy from a branch"
   - Choose "main" branch and "/ (root)" folder
   - Click "Save"
5. **Your blog will be live** at: `https://yourusername.github.io/my-blog`

### Option 2: Netlify (Alternative)

1. **Go to [netlify.com](https://netlify.com)** and sign up
2. **Drag and drop** your entire blog folder to the Netlify dashboard
3. **Your blog will be live** at a random URL (you can customize it)

### Option 3: Vercel (Alternative)

1. **Go to [vercel.com](https://vercel.com)** and sign up
2. **Import your project** from GitHub or upload files directly
3. **Deploy automatically** with a custom domain option

## Sample Posts

The blog comes with two sample posts to demonstrate the functionality:
1. "Welcome to My Blog" - An introduction post
2. "The Beauty of Simplicity" - A post about design philosophy

## Post Management

- **Creating**: Use the "New Post" form to create new articles
- **Editing**: Click "Edit" on any post to modify it using the same form
- **Deleting**: Click "Delete" and confirm to permanently remove a post
- **Tags**: Add comma-separated tags to organize your posts
- **Word Count**: Automatically calculated and displayed in statistics

## Customization

You can easily customize the blog by:
- Changing colors in `style.css`
- Modifying fonts in the HTML head section
- Adding new features in `script.js`
- Updating the blog title and description in `index.html`

## Important Notes

- **Local Storage**: Posts are saved in each visitor's browser locally
- **No Backend**: This is a static site, so posts aren't shared between users
- **Custom Domain**: You can add a custom domain to your hosted blog
- **Analytics**: Consider adding Google Analytics to track visitors

Enjoy blogging with your new personal blog! 