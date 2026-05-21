import { expect, test } from '@playwright/test';

const apiURL = process.env.E2E_API_URL || 'http://localhost:5000/api';
const strictMode = process.env.E2E_STRICT === '1';

const uniqueUser = () => {
  const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  return {
    username: `E2EUser${stamp}`,
    email: `e2e.${stamp}@example.com`,
    password: 'E2Epass123!',
  };
};

async function loginWithUi(page, email, password) {
  await page.goto('/login');
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole('button', { name: /se connecter/i }).click();
}

async function registerWithUi(page, user) {
  await page.goto('/register');
  await page.locator('input[name="username"]').fill(user.username);
  await page.locator('input[name="email"]').fill(user.email);
  await page.locator('input[name="password"]').fill(user.password);
  await page.locator('input[name="confirmPassword"]').fill(user.password);
  await page.getByRole('button', { name: /creer mon compte|créer mon compte/i }).click();
}

test.describe('BatailleCoq E2E - smoke API et pages publiques', () => {
  test('API health, tournois et equipes repondent', async ({ request }) => {
    const health = await request.get(`${apiURL}/health`);
    await expect(health).toBeOK();
    await expect(await health.json()).toMatchObject({ success: true });

    const tournaments = await request.get(`${apiURL}/tournaments`);
    await expect(tournaments).toBeOK();
    expect(await tournaments.json()).toHaveProperty('tournaments');

    const teams = await request.get(`${apiURL}/teams`);
    await expect(teams).toBeOK();
    expect(await teams.json()).toHaveProperty('teams');
  });

  test('page tournois et filtres', async ({ page }) => {
    await page.goto('/tournaments');
    await expect(page.getByRole('heading', { name: /^Tournois$/i })).toBeVisible();
    await page.getByRole('button', { name: /valorant/i }).click();
    await page.getByRole('button', { name: /a venir|à venir/i }).click();
    await expect(page.getByText(/impossible de charger/i)).toHaveCount(0);
  });

  test('pages equipes et classement', async ({ page }) => {
    await page.goto('/teams');
    await expect(page.getByRole('heading', { name: /equipes|équipes|teams/i })).toBeVisible();
    await expect(page.getByText(/impossible de charger/i)).toHaveCount(0);

    await page.goto('/rankings');
    await expect(page.getByRole('heading', { name: /classement|rankings|leaderboard/i })).toBeVisible();
  });

  test('navigation responsive mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/tournaments');

    await expect(page.getByText('BatailleCoq')).toBeVisible();
    await page.getByRole('button', { name: /toggle menu/i }).click();
    await expect(page.getByRole('link', { name: /teams/i })).toBeVisible();
  });
});

test.describe('BatailleCoq E2E - authentification', () => {
  test('validation client sur inscription', async ({ page }) => {
    await page.goto('/register');
    await page.locator('input[name="username"]').fill('ab');
    await page.locator('input[name="email"]').fill(`short.${Date.now()}@example.com`);
    await page.locator('input[name="password"]').fill('123456');
    await page.locator('input[name="confirmPassword"]').fill('654321');
    await page.getByRole('button', { name: /creer mon compte|créer mon compte/i }).click();

    await expect(page.getByText(/au moins 3 caracteres|au moins 3 caractères|ne correspondent pas/i).first()).toBeVisible();
  });

  test('inscription, deconnexion et reconnexion utilisateur', async ({ page }) => {
    const user = uniqueUser();

    await registerWithUi(page, user);
    await expect(page).toHaveURL('/');
    await expect.poll(() => page.evaluate(() => localStorage.getItem('token'))).toBeTruthy();

    await page.getByRole('button', { name: /deconnexion|déconnexion/i }).click();
    await expect(page).toHaveURL(/\/login/);

    await loginWithUi(page, user.email, user.password);
    // Vérifier que l'utilisateur est connecté - utiliser un sélecteur plus spécifique
    // pour éviter les faux positifs (le nom peut apparaître dans plusieurs endroits)
    await expect(page.getByRole('button', { name: /deconnexion|déconnexion/i })).toBeVisible();
  });

  test('admin seed peut acceder au dashboard admin', async ({ page, request }) => {
    const login = await request.post(`${apiURL}/auth/login`, {
      data: { email: 'admin@bataillecoq.re', password: 'admin123' },
    });

    test.skip(!login.ok(), 'Compte admin seed indisponible dans cette base locale.');

    await loginWithUi(page, 'admin@bataillecoq.re', 'admin123');
    await expect(page.getByText(/^Admin$/)).toBeVisible();

    await page.goto('/admin/tournaments');
    await expect(page.getByText(/gestion|creer|créer|nouveau|tournoi/i).first()).toBeVisible();
  });
});

test.describe('BatailleCoq E2E - Gestion des erreurs et accès', () => {
  test('login invalide garde un message erreur visible', async ({ page }) => {
    await loginWithUi(page, 'wrong@example.com', 'wrongpass');
    
    // Le message d'erreur doit rester visible sur la page de login
    await expect(page.getByText(/invalid credentials|incorrect|impossible|erreur|email ou mot de passe incorrect/i).first()).toBeVisible({ timeout: 5000 });
    
    // La page doit rester sur /login (pas de redirection automatique)
    expect(page.url()).toContain('/login');
  });

  test('utilisateur non-admin voit un refus clair sur la route admin', async ({ page }) => {
    const user = uniqueUser();
    await registerWithUi(page, user);
    await expect(page).toHaveURL('/');

    // Essayer d'accéder à la route admin
    await page.goto('/admin/tournaments');
    
    // Doit voir un message d'accès refusé explicite
    await expect(page.getByText(/accès refusé|permissions|administrateurs/i).first()).toBeVisible({ timeout: 5000 });
  });
});
