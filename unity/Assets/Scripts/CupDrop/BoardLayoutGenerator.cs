using UnityEngine;

namespace CupHero.CupDrop
{
    public class BoardLayoutGenerator : MonoBehaviour
    {
        [SerializeField] private GameObject pinPrefab;
        [SerializeField] private int rows = 8;
        [SerializeField] private int columns = 7;
        [SerializeField] private float spacingX = 1f;
        [SerializeField] private float spacingY = 0.8f;

        [ContextMenu("Generate Board")]
        public void GenerateBoard()
        {
            foreach (Transform child in transform)
            {
                DestroyImmediate(child.gameObject);
            }

            for (int row = 0; row < rows; row++)
            {
                float rowOffsetX = (row % 2 == 1) ? spacingX / 2f : 0f;

                for (int col = 0; col < columns; col++)
                {
                    float posX = col * spacingX + rowOffsetX - (columns * spacingX) / 2f;
                    float posY = row * spacingY;

                    Vector3 pinPosition = new Vector3(posX, posY, 0f);
                    GameObject pin = Instantiate(pinPrefab, pinPosition, Quaternion.identity, transform);
                    pin.name = $"Pin_{row}_{col}";
                }
            }
        }
    }
}
