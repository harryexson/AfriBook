import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { url, restaurantId, source } = await req.json();

    if (!url) {
      return Response.json({ error: 'URL is required' }, { status: 400 });
    }

    // Use LLM to extract menu data from the URL
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `Extract menu items from the following URL: ${url}
      
      For each menu item, extract:
      - name (string)
      - description (string, may be empty)
      - price (number)
      - category (string - e.g., appetizers, entrees, desserts, beverages, sides)
      - image_url (string if visible in webpage, otherwise null)
      - is_vegetarian (boolean)
      - is_vegan (boolean)
      - is_spicy (boolean)
      
      Return as a JSON array of menu items. Only return valid JSON array, no other text.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                description: { type: "string" },
                price: { type: "number" },
                category: { type: "string" },
                image_url: { type: ["string", "null"] },
                is_vegetarian: { type: "boolean" },
                is_vegan: { type: "boolean" },
                is_spicy: { type: "boolean" }
              }
            }
          },
          source_name: { type: "string" }
        }
      }
    });

    if (!response?.items || response.items.length === 0) {
      return Response.json({
        error: 'No menu items could be extracted from the provided URL',
        suggestion: 'Try a different restaurant page or manually add menu items'
      }, { status: 400 });
    }

    // If restaurantId is provided, create in database
    // Otherwise, just return the items for the caller to handle
    const createdItems = [];
    const errors = [];

    if (restaurantId) {
      const MenuItem = base44.entities.MenuItem;
      
      for (const item of response.items) {
        try {
          const created = await MenuItem.create({
            restaurant_id: restaurantId,
            name: item.name?.trim() || 'Untitled Item',
            description: item.description?.trim() || '',
            category: item.category?.toLowerCase() || 'other',
            price: parseFloat(item.price) || 0,
            image_url: item.image_url || null,
            available: true,
            is_vegetarian: item.is_vegetarian || false,
            is_vegan: item.is_vegan || false,
            is_spicy: item.is_spicy || false
          });
          createdItems.push(created);
        } catch (error) {
          errors.push({
            item: item.name,
            error: error.message
          });
        }
      }
    } else {
      // During onboarding, return formatted items without saving
      for (const item of response.items) {
        createdItems.push({
          name: item.name?.trim() || 'Untitled Item',
          description: item.description?.trim() || '',
          category: item.category?.toLowerCase() || 'entrees',
          price: parseFloat(item.price) || 0,
          image_url: item.image_url || null,
          available: true
        });
      }
    }

    return Response.json({
      success: true,
      imported: createdItems.length,
      failed: errors.length,
      items: createdItems,
      errors: errors,
      source: response.source_name || source
    });
  } catch (error) {
    console.error('Menu import error:', error);
    return Response.json({
      error: error.message || 'Failed to import menu'
    }, { status: 500 });
  }
});