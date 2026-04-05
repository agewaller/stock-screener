/* ============================================
   DD Payment - PayPal Subscription Integration
   ============================================ */

const DDPayment = {
  _rendered: false,

  // Render PayPal subscription button into a container
  renderButton(containerId) {
    if (this._rendered) return;
    if (typeof paypal === 'undefined') {
      console.warn('PayPal SDK not loaded');
      return;
    }

    const container = document.getElementById(containerId);
    if (!container) return;

    // Clear existing content
    container.innerHTML = '';

    try {
      paypal.Buttons({
        style: {
          shape: 'pill',
          color: 'gold',
          layout: 'vertical',
          label: 'subscribe'
        },

        createSubscription: function(data, actions) {
          return actions.subscription.create({
            plan_id: DDConfig.paypal.planId
          });
        },

        onApprove: function(data) {
          // Subscription approved
          DDStore.setSubscription({
            active: true,
            paypalSubscriptionId: data.subscriptionID,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          });

          // Save to Firestore
          DDAuth.saveUserData();

          DDApp.showToast('Subscription activated! Welcome to VM Due Diligence.', 'success');
          DDApp.navigate('dashboard');
          DDApp.render();
        },

        onError: function(err) {
          console.error('PayPal error:', err);
          DDApp.showToast('Payment failed. Please try again.', 'error');
        },

        onCancel: function() {
          DDApp.showToast('Payment cancelled.', 'info');
        }
      }).render('#' + containerId).then(() => {
        this._rendered = true;
      });
    } catch (e) {
      console.warn('PayPal button render failed:', e);
      // Show fallback
      container.innerHTML = `
        <div style="text-align:center; padding: 20px; color: var(--text-secondary); font-size: 0.85rem;">
          <p>PayPal integration requires configuration.</p>
          <p style="margin-top:8px;">Set your PayPal Plan ID in <code>dd-config.js</code></p>
          <button class="btn btn-gold btn-lg" style="margin-top:16px;" onclick="DDPayment.activateDemo()">
            Demo: Activate Subscription
          </button>
        </div>
      `;
    }
  },

  // Demo activation (for development)
  activateDemo() {
    DDStore.setSubscription({
      active: true,
      paypalSubscriptionId: 'demo_' + Date.now(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });
    DDApp.showToast('Demo subscription activated!', 'success');
    DDApp.navigate('dashboard');
    DDApp.render();
  },

  // Cancel subscription
  async cancelSubscription() {
    const sub = DDStore.get('subscription');
    if (sub.paypalSubscriptionId && sub.paypalSubscriptionId.startsWith('demo')) {
      DDStore.setSubscription({ active: false, paypalSubscriptionId: null, expiresAt: null });
      DDApp.showToast('Subscription cancelled.', 'info');
      DDApp.render();
      return;
    }

    // For real PayPal subscriptions, redirect to PayPal management
    window.open('https://www.paypal.com/myaccount/autopay/', '_blank');
    DDApp.showToast('Please cancel your subscription on PayPal.', 'info');
  },

  // Check subscription status (would call PayPal API in production)
  async checkStatus() {
    const sub = DDStore.get('subscription');
    if (!sub.active) return false;
    if (sub.expiresAt && new Date(sub.expiresAt) < new Date()) {
      DDStore.setSubscription({ active: false });
      return false;
    }
    return true;
  },

  // Reset render state (needed when navigating)
  resetRenderState() {
    this._rendered = false;
  }
};
