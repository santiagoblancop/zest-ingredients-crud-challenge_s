import { FormEvent, useEffect, useState } from 'react';

type Ingredient = {
  id: string;
  name: string;
};

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

function App() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  const normalizedSearchTerm = searchTerm.trim().toLocaleLowerCase();
  const filteredIngredients = ingredients.filter((ingredient) =>
    ingredient.name.toLocaleLowerCase().includes(normalizedSearchTerm),
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadIngredients() {
      try {
        const response = await fetch(`${apiUrl}/ingredients`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Unable to load ingredients.');
        }

        const data: Ingredient[] = await response.json();
        setIngredients(data);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        setLoadError('Unable to load ingredients. Please try again later.');
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadIngredients();

    return () => controller.abort();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setSubmitError('Enter an ingredient name.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const response = await fetch(`${apiUrl}/ingredients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName }),
      });

      if (!response.ok) {
        throw new Error('Unable to add ingredient.');
      }

      const ingredient: Ingredient = await response.json();
      setIngredients((currentIngredients) => [...currentIngredients, ingredient]);
      setName('');
    } catch {
      setSubmitError('Unable to add ingredient. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function startEditing(ingredient: Ingredient) {
    setEditingId(ingredient.id);
    setEditingName(ingredient.name);
    setActionError('');
  }

  function cancelEditing() {
    setEditingId(null);
    setEditingName('');
    setActionError('');
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();

    const trimmedName = editingName.trim();
    if (!trimmedName) {
      setActionError('Enter an ingredient name.');
      return;
    }

    setUpdatingId(id);
    setActionError('');

    try {
      const response = await fetch(`${apiUrl}/ingredients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName }),
      });

      if (!response.ok) {
        throw new Error('Unable to update ingredient.');
      }

      const updatedIngredient: Ingredient = await response.json();
      setIngredients((currentIngredients) =>
        currentIngredients.map((ingredient) =>
          ingredient.id === id ? updatedIngredient : ingredient,
        ),
      );
      setEditingId(null);
      setEditingName('');
    } catch {
      setActionError('Unable to update ingredient. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete(ingredient: Ingredient) {
    const shouldDelete = window.confirm(`Delete ${ingredient.name}?`);
    if (!shouldDelete) {
      return;
    }

    setDeletingId(ingredient.id);
    setActionError('');

    try {
      const response = await fetch(`${apiUrl}/ingredients/${ingredient.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Unable to delete ingredient.');
      }

      setIngredients((currentIngredients) =>
        currentIngredients.filter((currentIngredient) => currentIngredient.id !== ingredient.id),
      );

      if (editingId === ingredient.id) {
        setEditingId(null);
        setEditingName('');
      }
    } catch {
      setActionError('Unable to delete ingredient. Please try again.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="min-h-screen px-6 py-12 sm:py-16">
      <section className="mx-auto max-w-2xl">
        <header className="mb-8 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">
            Zest catalog
          </p>
          <h1 className="font-heading text-4xl font-extrabold text-foreground sm:text-5xl">
            Ingredients
          </h1>
          <p className="mt-3 text-muted-foreground">
            Keep the kitchen catalog fresh by adding ingredients below.
          </p>
        </header>

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <form className="border-b border-border bg-secondary p-5 sm:p-6" onSubmit={handleSubmit}>
            <label className="mb-2 block font-semibold text-foreground" htmlFor="ingredient-name">
              Add an ingredient
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                className="min-w-0 flex-1 rounded-lg border border-border bg-card px-4 py-3 text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary"
                id="ingredient-name"
                name="name"
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Tomato"
                type="text"
                value={name}
              />
              <button
                className="rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? 'Adding…' : 'Add ingredient'}
              </button>
            </div>
            {submitError && (
              <p className="mt-3 text-sm font-medium text-primary" role="alert">
                {submitError}
              </p>
            )}
          </form>

          <div className="p-5 sm:p-6">
            <h2 className="font-heading text-2xl font-bold text-foreground">Your ingredients</h2>

            {!isLoading && !loadError && ingredients.length > 0 && (
              <div className="mt-5">
                <label className="mb-2 block font-semibold text-foreground" htmlFor="ingredient-search">
                  Search ingredients
                </label>
                <input
                  className="w-full rounded-lg border border-border bg-card px-4 py-3 text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary"
                  id="ingredient-search"
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by name"
                  type="search"
                  value={searchTerm}
                />
              </div>
            )}

            {actionError && (
              <p className="mt-5 rounded-lg bg-muted p-4 font-medium text-primary" role="alert">
                {actionError}
              </p>
            )}

            {isLoading && (
              <p className="mt-5 rounded-lg bg-muted p-4 text-muted-foreground" role="status">
                Loading ingredients…
              </p>
            )}

            {!isLoading && loadError && (
              <p className="mt-5 rounded-lg bg-muted p-4 font-medium text-primary" role="alert">
                {loadError}
              </p>
            )}

            {!isLoading && !loadError && ingredients.length === 0 && (
              <p className="mt-5 rounded-lg bg-muted p-4 text-muted-foreground">
                No ingredients yet. Add the first one above.
              </p>
            )}

            {!isLoading &&
              !loadError &&
              ingredients.length > 0 &&
              filteredIngredients.length === 0 && (
                <p className="mt-5 rounded-lg bg-muted p-4 text-muted-foreground">
                  No ingredients match your search.
                </p>
              )}

            {!isLoading && !loadError && filteredIngredients.length > 0 && (
              <ul className="mt-5 divide-y divide-border" aria-label="Ingredients">
                {filteredIngredients.map((ingredient) => (
                  <li className="py-3 first:pt-0 last:pb-0" key={ingredient.id}>
                    {editingId === ingredient.id ? (
                      <form
                        className="flex flex-col gap-2 sm:flex-row"
                        onSubmit={(event) => handleUpdate(event, ingredient.id)}
                      >
                        <label className="sr-only" htmlFor={`edit-ingredient-${ingredient.id}`}>
                          Ingredient name
                        </label>
                        <input
                          className="min-w-0 flex-1 rounded-lg border border-border bg-card px-3 py-2 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                          id={`edit-ingredient-${ingredient.id}`}
                          onChange={(event) => setEditingName(event.target.value)}
                          type="text"
                          value={editingName}
                        />
                        <button
                          className="rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={updatingId === ingredient.id}
                          type="submit"
                        >
                          {updatingId === ingredient.id ? 'Saving…' : 'Save'}
                        </button>
                        <button
                          className="rounded-lg border border-border px-4 py-2 font-semibold text-foreground"
                          disabled={updatingId === ingredient.id}
                          onClick={cancelEditing}
                          type="button"
                        >
                          Cancel
                        </button>
                      </form>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className="h-2.5 w-2.5 rounded-full bg-lime" aria-hidden="true" />
                        <span className="min-w-0 flex-1 font-medium text-foreground">
                          {ingredient.name}
                        </span>
                        <button
                          className="font-semibold text-muted-foreground hover:text-foreground"
                          onClick={() => startEditing(ingredient)}
                          type="button"
                        >
                          Edit
                        </button>
                        <button
                          className="font-semibold text-primary disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={deletingId === ingredient.id}
                          onClick={() => void handleDelete(ingredient)}
                          type="button"
                        >
                          {deletingId === ingredient.id ? 'Deleting…' : 'Delete'}
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;
