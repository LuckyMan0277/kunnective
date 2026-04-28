using UnityEngine;

namespace CupHero.CupDrop
{
    public class Pin : MonoBehaviour
    {
        [SerializeField] private Color gizmoColor = Color.yellow;

        private void OnDrawGizmos()
        {
            Gizmos.color = gizmoColor;
            Gizmos.DrawWireSphere(transform.position, 0.2f);
        }
    }
}
