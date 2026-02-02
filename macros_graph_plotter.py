import matplotlib.pyplot as plt
import io
import base64


def generate_pieplot(values : list[float], colors : list[str]) -> str:
    fig, ax = plt.subplots(1,1)

    ax.pie(values,colors=colors)

    buffer = io.BytesIO()

    plt.savefig(buffer,format='png',transparent=True)
    plt.close()

    buffer.seek(0)

    string = base64.b64encode(buffer.read()).decode('utf-8')

    return string

